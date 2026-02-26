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
      }}
    >
      <div
        style={{
          width: "240px",
          background: "#111",
          borderRight: "1px solid #333",
          padding: "20px",
          color: "white",
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
          <option value="cpp">C++</option>
        </select>

        <h3
          style={{ color: "#4ade80", fontSize: "0.8rem", marginBottom: "20px" }}
        >
          COLLABORATORS
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {users.map((user) => (
            <div
              key={user.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "0.9rem",
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
    </div>
  );
}

export default App;
