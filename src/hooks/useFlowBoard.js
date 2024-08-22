import useToast from "@/hooks/useToast";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai"; // Vercel AI sdk
import { useState, useCallback, useRef, useMemo } from "react";
import { useToggle } from "usehooks-ts";
import {
  parsePartialEdgesJSON,
  parsePartialNodesJSON,
  setLocalStorage,
  getLocalStorage,
} from "@/helpers/utils";
import { addEdge, reconnectEdge, useNodesState, useEdgesState, useReactFlow } from "@xyflow/react";
import systemPrompt from "@/constants/system";

const initialNodes = [
  {
    id: "1",
    type: "input",
    data: { label: "Start Process" },
    position: { x: 250, y: 25 },
  },
  {
    id: "2",
    data: { label: "Receive Order" },
    position: { x: 250, y: 100 },
  },
  {
    id: "3",
    data: { label: "Check Inventory" },
    position: { x: 250, y: 175 },
  },
  {
    id: "4",
    data: { label: "Inventory Available?" },
    position: { x: 250, y: 250 },
  },
  {
    id: "5",
    data: { label: "Process Payment" },
    position: { x: 100, y: 325 },
  },
  {
    id: "6",
    data: { label: "Notify Customer" },
    position: { x: 400, y: 325 },
  },
  {
    id: "7",
    data: { label: "Ship Order" },
    position: { x: 250, y: 400 },
  },
  {
    id: "8",
    type: "output",
    data: { label: "End Process" },
    position: { x: 250, y: 475 },
  },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e4-5", source: "4", target: "5", label: "Yes" },
  { id: "e4-6", source: "4", target: "6", label: "No" },
  { id: "e5-7", source: "5", target: "7" },
  { id: "e6-7", source: "6", target: "7" },
  { id: "e7-8", source: "7", target: "8" },
];

export default function useFlowBoard(apiKey) {
  const diagramResult = getLocalStorage("diagramResult");
  const openai = useRef(
    createOpenAI({
      apiKey,
    })
  );
  const { fitView } = useReactFlow();
  const edgeReconnectSuccessful = useRef(true);
  const magicText = useRef("");
  const tries = useRef(0);
  const isTrying = useRef(false);
  const isFitView = useRef(false);
  const firstNodeId = useRef(null);
  const { info, warn, success, error } = useToast();
  const [isOpen, toggleOpen] = useToggle();
  const [isMagicText, setIsMagicText] = useState(getLocalStorage("isMagicText") ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(diagramResult?.nodes ?? initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(diagramResult?.edges ?? initialEdges);
  const [prompt, setPrompt] = useState(
    diagramResult?.prompt ??
      "Develop a sales system to manage customer orders, process payments, and generate invoices"
  );

  const data = useMemo(
    () => ({
      nodes,
      edges,
    }),
    [nodes, edges]
  );

  const controller = useRef(null);

  const $onNodesChange = useCallback(
    (props) => {
      onNodesChange(props);
      console.log(props);
    },
    [onNodesChange]
  );

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge, newConnection) => {
      edgeReconnectSuccessful.current = true;
      setEdges((els) => {
        const diagramResult = getLocalStorage("diagramResult");
        const newEdges = reconnectEdge(oldEdge, newConnection, els);
        setLocalStorage("diagramResult", {
          ...diagramResult,
          edges: newEdges,
        });
        return newEdges;
      });
    },
    [setEdges]
  );

  const onReconnectEnd = useCallback(
    (_, edge) => {
      if (!edgeReconnectSuccessful.current) {
        setEdges((eds) => {
          const diagramResult = getLocalStorage("diagramResult");
          const newEdges = eds.filter((e) => e.id !== edge.id);
          setLocalStorage("diagramResult", {
            ...diagramResult,
            edges: newEdges,
          });
          return newEdges;
        });
      }

      edgeReconnectSuccessful.current = true;
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const diagramResult = getLocalStorage("diagramResult");
        const newEdges = addEdge(params, eds);
        setLocalStorage("diagramResult", {
          ...diagramResult,
          edges: newEdges,
        });

        return newEdges;
      });
    },
    [setEdges]
  );

  const cancel = useCallback(() => {
    if (controller.current) {
      controller.current.abort();
      isTrying.current = false;
      isFitView.current = false;
      firstNodeId.current = null;
      tries.current = 0;
      warn("Your diagram has been canceled");
    }
  }, [warn]);

  const promptMagicText = useCallback(async (prompt) => {
    const result = await streamText({
      model: openai.current("gpt-4o-mini"),
      prompt,
      system: `Extract all the requirements needed to create this diagram. Ensure the diagram is complete and detailed, including all identified requirements. Do not leave out any details and make sure that each requirement is clearly represented in the diagram, keep in mind that the diagram should be brief and short but with the requirements captured. The goal is to obtain a final diagram that accurately and completely reflects all the aspects necessary for its implementation. Send only the plain text of the requirements using a list format with arrows (not mardown or other special formatting)
      `,
    });
    let text = "";
    for await (const chunk of result.textStream) {
      text += chunk;
    }

    return text;
  }, []);

  const generateTextAI = useCallback(async () => {
    controller.current = new AbortController();
    isFitView.current = false;
    firstNodeId.current = null;

    try {
      if (isError) {
        setIsError(null);
      }
      setIsLoading(true);

      let $prompt = "";

      if (magicText.current && isMagicText) {
        $prompt = magicText.current;
      } else if (isMagicText) {
        info("Applying magic text to the prompt...");
        const promptMagic = await promptMagicText(prompt);
        $prompt = promptMagic;
        magicText.current = promptMagic;
      } else {
        $prompt = prompt;
      }

      info("Creating prompt & analyzing the diagram...");

      const result = await streamText({
        abortSignal: controller.current.signal,
        model: openai.current("gpt-4o"),
        system: systemPrompt,
        prompt: `Given an instruction to create the corresponding diagram, you must send the result in JSON format without explanations, without markdown formatting or filler text. Send the full text, if it is very long, summarize it more and without special formatting by grouping the nodes in a "nodes" property and the edges in other "edges" at the end, it should look like this:
        {
          "nodes" : [],
          "edges" : []
        }
        The user asks: ${$prompt}`,
      });

      let text = "";
      for await (const chunk of result.textStream) {
        text += chunk;

        try {
          const $nodes = parsePartialNodesJSON(text);
          const $edges = parsePartialEdgesJSON(text);

          if ($nodes?.length > 0) {
            setNodes($nodes);

            if (!isFitView.current) {
              isFitView.current = true;
              const [firstNode] = $nodes;
              const { id } = firstNode;
              firstNodeId.current = id;
              fitView({ nodes: [{ id: id }], duration: 500 });
              console.log({ firstNode });
            }
          }

          if ($edges?.length > 0) {
            setEdges($edges);
          }
        } catch {}
      }

      const json = JSON.parse(text);
      
      success("The diagram has been generated successfully");
      setNodes(json.nodes);
      setEdges(json.edges);

      setLocalStorage("diagramResult", {
        nodes: json.nodes,
        edges: json.edges,
        prompt,
      });

      magicText.current = "";
      tries.current = 0;
    } catch (err) {
      if (err.name !== "AbortError") {
        error("An error has occurred");
        setIsError(err);

        if (tries.current < 3) {
          isTrying.current = true;
          tries.current = tries.current + 1;
          setIsError(null);
          warn("Retrying...");
          generateTextAI();
        } else {
          isTrying.current = false;
        }
      }
    } finally {
      if (!isTrying.current) {
        setIsLoading(false);
      }
    }
  }, [
    info,
    isError,
    prompt,
    success,
    warn,
    error,
    promptMagicText,
    isMagicText,
    setEdges,
    setNodes,
  ]);

  const onChangeText = useCallback((e) => {
    e.target.style.height = "0px";
    e.target.style.height = e.target.scrollHeight + 20 + "px";
  }, []);

  const onChangePrompt = useCallback((e) => {
    setPrompt(e.target.value);
  }, []);

  const onChangeIsMagicText = useCallback((e) => {
    setIsMagicText(e.target.checked);
    setLocalStorage("isMagicText", e.target.checked);
  }, []);

  return {
    onReconnectEnd,
    onReconnect,
    onReconnectStart,
    onNodesChange: $onNodesChange,
    onEdgesChange,
    onConnect,
    cancel,
    promptMagicText,
    generateTextAI,
    onChangeText,
    onChangePrompt,
    isOpen,
    toggleOpen,
    isMagicText,
    isLoading,
    isError,
    prompt,
    onChangeIsMagicText,
    ...data,
  };
}
