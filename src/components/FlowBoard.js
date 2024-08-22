import DrawerMenu from "@/components/DrawerMenu";
import PromptInput from "@/components/PromptInput";
import SettingsButton from "@/components/SettingsButton";
import useFlowBoard from "@/hooks/useFlowBoard";
import Board from "./Board";

export default function FlowBoard({ apiKey }) {
  const {
    onReconnectEnd,
    onReconnect,
    onReconnectStart,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    cancel,
    generateTextAI,
    onChangeText,
    onChangePrompt,
    isOpen,
    toggleOpen,
    isMagicText,
    isLoading,
    prompt,
    onChangeIsMagicText,
  } = useFlowBoard(apiKey);

  return (
    <>
      <SettingsButton toggleOpen={toggleOpen} />

      <PromptInput
        isLoading={isLoading}
        prompt={prompt}
        onChangePrompt={onChangePrompt}
        onChangeText={onChangeText}
        cancel={cancel}
        generateTextAI={generateTextAI}
      />

      <Board
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
      />

      <DrawerMenu
        isOpen={isOpen}
        toggleOpen={toggleOpen}
        isMagicText={isMagicText}
        onChangeIsMagicText={onChangeIsMagicText}
      />
    </>
  );
}
