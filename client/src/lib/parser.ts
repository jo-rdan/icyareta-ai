export const parseMarkdown = (text: string) => {
  return (
    text
      // 1. Convert ### Header into <h3>
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      // 2. Convert # Header into <h1>
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      // 3. Convert **Bold** into <b>
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
      // 4. Convert > Blockquote into <blockquote>
      .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
      // 5. Convert --- into <hr />
      .replace(/^---$/gim, "<hr />")
      // 6. Handle New Lines (convert double new lines to paragraphs)
      .replace(/\n$/gim, "<br />")
  );
};
