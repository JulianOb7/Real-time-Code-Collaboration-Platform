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

  useEffect(() => {
    socket.on("users-list", (userList: User[]) => {
      setUsers(userList);
    });

    socket.on("code-change", (newValue: string) => {
      if (editorRef.current && newValue !== editorRef.current.getValue()) {
        isReceiving.current = true;
        editorRef.current.setValue(newValue);
        isReceiving.current = false;
      }
    });

    return () => {
      socket.off("users-list");
      socket.off("code-change");
    };
  }, []);

  function handleEditorChange(value: string | undefined) {
    if (!isReceiving.current && value !== undefined) {
      socket.emit("code-change", value);
    }
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
          style={{
            color: "#4ade80",
            fontSize: "0.9rem",
            letterSpacing: "1px",
            marginBottom: "20px",
          }}
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
                  backgroundColor: "#4ade80",
                }}
              />
              <span>{user.name}</span>
              {user.id === socket.id && (
                <span style={{ opacity: 0.5, fontSize: "0.7rem" }}>(You)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <Editor
          height="100%"
          defaultLanguage="javascript"
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
