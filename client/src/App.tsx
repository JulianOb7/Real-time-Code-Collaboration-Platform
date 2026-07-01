import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import socket from "./socket";

interface User {
  id: string;
  name: string;
}

function App() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const isReceiving = useRef(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    socket.on("users-list", (userList: User[]) => {
      setUsers(userList);
      const me = userList.find((u) => u.id === socket.id);
      if (me && !userName) setUserName(me.name);
    });

    socket.on("code-change", (newValue: string) => {
      if (editorRef.current && newValue !== editorRef.current.getValue()) {
        isReceiving.current = true;
        editorRef.current.setValue(newValue);
        isReceiving.current = false;
      }
    });

    socket.on("language-change", (newLang: string) => {
      setLanguage(newLang);
    });

    return () => {
      socket.off("users-list");
      socket.off("code-change");
      socket.off("language-change");
    };
  }, [userName]);

  const runCode = async () => {
    if (!editorRef.current) return;
    setIsRunning(true);
    setOutput("Running...");

    const code = editorRef.current.getValue();

    const languageIds: { [key: string]: number } = {
      javascript: 63,
      typescript: 74,
      python: 71,
      java: 62,
      csharp: 51,
    };

    try {
      const response = await fetch(
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true",
        {
          method: "POST",
          headers: {
            "x-rapidapi-key": import.meta.env.VITE_RAPIDAPI_KEY,
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language_id: languageIds[language],
            source_code: btoa(code),
          }),
        },
      );

      const data = await response.json();

      const result = data.stdout
        ? atob(data.stdout)
        : data.stderr
          ? atob(data.stderr)
          : data.compile_output
            ? atob(data.compile_output)
            : "Code executed with no output.";

      setOutput(result);
    } catch (error) {
      console.error(error);
      setOutput("Error: Check your internet connection or API subscription.");
    } finally {
      setIsRunning(false);
    }
  };

  function handleEditorChange(value: string | undefined) {
    if (!isReceiving.current && value !== undefined) {
      socket.emit("code-change", value);
    }
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newName = e.target.value;
    setUserName(newName);
    socket.emit("change-name", newName);
  }

  function handleLanguageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLang = e.target.value;
    setLanguage(newLang);
    socket.emit("language-change", newLang);
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#1e1e1e",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "240px",
          background: "#111",
          borderRight: "1px solid #333",
          padding: "20px",
          color: "white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3
          style={{ color: "#4ade80", fontSize: "0.8rem", marginBottom: "10px" }}
        >
          YOUR NAME
        </h3>
        <input
          type="text"
          value={userName}
          onChange={handleNameChange}
          style={{
            width: "100%",
            background: "#222",
            border: "1px solid #444",
            color: "white",
            padding: "8px",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        />

        <h3
          style={{ color: "#4ade80", fontSize: "0.8rem", marginBottom: "10px" }}
        >
          LANGUAGE
        </h3>
        <select
          value={language}
          onChange={handleLanguageChange}
          style={{
            width: "100%",
            background: "#222",
            border: "1px solid #444",
            color: "white",
            padding: "8px",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="csharp">C#</option>
        </select>

        <button
          onClick={runCode}
          disabled={isRunning}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: isRunning ? "#2a6a43" : "#4ade80",
            color: "black",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: isRunning ? "not-allowed" : "pointer",
            marginBottom: "20px",
          }}
        >
          {isRunning ? "RUNNING..." : "RUN CODE"}
        </button>

        <h3
          style={{ color: "#4ade80", fontSize: "0.8rem", marginBottom: "20px" }}
        >
          COLLABORATORS
        </h3>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {users.map((user) => (
            <div
              key={user.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "0.9rem",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: user.id === socket.id ? "#4ade80" : "#666",
                }}
              />
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }}>
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            onChange={handleEditorChange}
            onMount={(editor) => (editorRef.current = editor)}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              automaticLayout: true,
            }}
          />
        </div>
        <div
          style={{
            height: "30%",
            background: "#000",
            color: "#4ade80",
            padding: "15px",
            borderTop: "1px solid #333",
            overflowY: "auto",
            fontFamily: "monospace",
          }}
        >
          <div
            style={{ fontSize: "0.8rem", color: "#888", marginBottom: "5px" }}
          >
            TERMINAL:
          </div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{output}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;
