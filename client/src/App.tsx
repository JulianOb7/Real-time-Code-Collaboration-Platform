import Editor from "@monaco-editor/react";

function App() {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        defaultValue={`function saludar() {console.log("hola")}`}
        theme="vs-dark"
      />
    </div>
  );
}

export default App;
