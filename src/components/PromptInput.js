import { Textarea, Button } from "@geist-ui/core";
import { BsArrowUpCircleFill } from "react-icons/bs";
import { BsFillStopCircleFill } from "react-icons/bs";

export default function PromptInput({ 
  isLoading,
  prompt,
  onChangePrompt,
  onChangeText,
  cancel,
  generateTextAI,
}) {
  return (
    <div className="input">
      <div className="input-wrapper">
        <Textarea
          disabled={isLoading}
          placeholder="Enter your diagram flow prompt here"
          value={prompt}
          onChange={isLoading ? null : onChangePrompt}
          width="100%"
          className="textarea"
          scale={3}
          onInput={isLoading ? null : onChangeText}
        />

        <Button
          iconRight={
            isLoading ? (
              <BsFillStopCircleFill color="#fff" size="1.8rem" />
            ) : (
              <BsArrowUpCircleFill color="#fff" size="1.8rem" />
            )
          }
          className="submit"
          onClick={isLoading ? cancel : generateTextAI}
          type="abort"
          scale={2.5}
          auto
        />
      </div>
    </div>
  );
}

