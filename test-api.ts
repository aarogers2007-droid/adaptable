import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

async function test() {
  console.log("1. Testing basic API call...");
  console.log("   ANTHROPIC_API_KEY set:", !!process.env.ANTHROPIC_API_KEY);
  console.log("   Key prefix:", process.env.ANTHROPIC_API_KEY?.slice(0, 10) + "...");
  
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      system: "Reply in one sentence.",
      messages: [{ role: "user", content: "Hello" }],
    });
    const text = response.content[0].type === "text" ? response.content[0].text : "no text";
    console.log("   BASIC CALL OK:", text);
  } catch (err: any) {
    console.error("   BASIC CALL FAILED:", err.message);
    console.error("   Status:", err.status);
    console.error("   Type:", err.error?.error?.type);
    return;
  }

  console.log("\n2. Testing streaming...");
  try {
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      system: "Reply in one sentence.",
      messages: [{ role: "user", content: "Hello" }],
    });

    let text = "";
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        text += event.delta.text;
      }
    }
    console.log("   STREAM OK:", text);

    const final = await stream.finalMessage();
    console.log("   Usage:", final.usage);
  } catch (err: any) {
    console.error("   STREAM FAILED:", err.message);
  }

  console.log("\n3. Testing with large system prompt (like lesson-chat)...");
  const bigPrompt = "You are a mentor. ".repeat(200) + "Reply in one sentence.";
  console.log("   System prompt length:", bigPrompt.length);
  try {
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: bigPrompt,
      messages: [{ role: "user", content: "Why do pets matter?" }],
    });

    let text = "";
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        text += event.delta.text;
      }
    }
    console.log("   BIG PROMPT OK:", text.slice(0, 100));
  } catch (err: any) {
    console.error("   BIG PROMPT FAILED:", err.message);
    console.error("   Status:", err.status);
  }
}

test();
