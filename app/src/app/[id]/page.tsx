"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter, useParams } from "next/navigation";
import axios from 'axios';
import styles from "../chat.module.css";
import { createClient } from "@/src/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { getUser } from "@/src/utils/supabase/useUser";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import useWebSocket, { ReadyState } from 'react-use-websocket';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons';

type MessageType = {
  id: string;
  chatId: string;
  domanda: string;
  risposta: string;
  data?: string;
};

type Conversation = {
  conversationId: string;
  utente: string;
  startDate: string;
  messages: MessageType[];
};

const forbiddenWords = [
  // VolgaritÃ generiche
  "cazz", "merd", "troi", "puttan", "stronz", "bastard", "figa",
  "culo", "minchi", "vaffanculo", "coglion", "sborra", "pompino",
  "fottiti", "masturb",

  // Insulti razziali / discriminatori
  "negr", "zingar", "froci", "ebre", "musulman", "cristian", "cattolic",
  "induis", "buddh", "omosessual", "lesbica", "bisessual",
  "terron", "polenton", "mongoloid", "handicappat", "storp",

  // Parole legate a violenza e armi
  "fucile", "mitra", "bomb", "distruzion",
  "uccider", "massacr", "omicidi", "stermin", "terrorism", "guerr",

  // Contenuti sessuali espliciti
  "sesso", "porn", "orgasm", "penetrazione", "anal", "sex",
  "incest", "bdsm", "sadomaso", "gangbang", "squirt"
];

const Chat: React.FC = () => {
  const { type, id } = useParams();
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [tab, setTab] = useState<"free" | "guide">(type === "free" ? "free" : "guide");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const isCreatingAnonUser = useRef<boolean>(false);
  const [isInputDisabled, setIsInputDisabled] = useState(false);

  const [containsForbiddenWords, setContainsForbiddenWords] = useState(false);
  const [remainingChars, setRemainingChars] = useState(200);

  const supabase = createClient();
  const [selectedFeedback, setSelectedFeedback] = useState<"thumbsUp" | "thumbsDown" | null>(null);

  /*
  const socketUrl = 'ws://localhost:8765';
  interface LastJsonMessageType {
    messageId: string;
    message: string;
  }
  const { sendJsonMessage, readyState } = useWebSocket<LastJsonMessageType>(socketUrl, {
    onMessage: (event) => {
      requestAnimationFrame(() => onMessage(event.data));
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    shouldReconnect: (closeEvent) => true, // Automatically reconnect on disconnect
  });
  */

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3050');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.answerChunk) {
        setAnswer((prev) => prev + data.answerChunk + ' '); // 累积流式回答
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  // Fetch all conversations
  const fetchAllConversations = async () => {
    const user = await getUser()
    // console.log("====", user);
    try {
      const response = await fetch('/api/getAllConversation', {
        method: 'GET',
        headers: {
          'userid': `${user?.id}`,
        },
      });

      const data = await response.json().then((data) => data.conversations);
      console.log("All conversations:", data);
      // const data = response.data.conversations;

      // Map conversations to the correct format
      const formattedConversations = data.map((conv: any) => {
        return {
          conversationId: conv.id,
          utente: conv.utente,
          startDate: conv.createdat,
          messages: conv.messages.map((msg: any) => {
            return {
              id: msg.id,
              domanda: msg.domanda,
              risposta: msg.risposta,
              data: msg.data,
            };
          }),
        };
      });

      setConversations(formattedConversations);
      console.log("[/type/id/] all conversations mapped:", formattedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };
  useEffect(() => {
    fetchAllConversations();
  }, []);




  // Load conversation based on route params
  useEffect(() => {
    if (!conversations.length) return;

    const conversation = conversations.find(
      (conv) => conv.conversationId === id
    );
    setCurrentConversation(conversation || null);
  }, [conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentConversation?.messages]);


  const handleConversationClick = (conversation: Conversation) => {
    console.log("Clicked conversation:", conversation);
    router.push(`${conversation.conversationId}`);
  };


  /**
   * Send a message to the backend and update the frontend with the response
   * @author Yixin
   * @date 2025-01-10
   * @lastmodified 2025-01-10
   * @lastmodifiedby Yixin
   */

  const handleInputChange = (e) => {
    const value = e.target.value;
    const words = value.split(/\s+/).filter(Boolean);
    const containsForbidden = words.some(word => forbiddenWords.includes(word.toLowerCase()));
    setInputValue(value);
    setRemainingChars(200 - value.length);
    setContainsForbiddenWords(containsForbidden);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentConversation || isInputDisabled || containsForbiddenWords) return;
    setIsInputDisabled(true);

    try {
      const response = await fetch('/api/storeQuestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat: currentConversation.conversationId,
          domanda: inputValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log("Message insert successful:", data);

      // Crea un nuovo messaggio
      const newMessage: MessageType = {
        id: data.currentMessage.at(0).id, // Un ID temporaneo
        chatId: data.currentMessage.at(0).chat, // ID della chat
        domanda: inputValue,
        risposta: "", // La risposta arriverà dal backend
      };

      // Aggiorna i messaggi della conversazione corrente nel frontend
      setCurrentConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
        };
      });
      sendJsonMessage({ messageId: data.currentMessage.at(0).id, message: data.currentMessage.at(0).domanda });
    } catch (error) {
      console.error("Error sending message:", error);
      setIsInputDisabled(false);
    } finally {
      setInputValue(""); // Resetta l'input
      // setIsInputDisabled(false); // Riabilita l'input
    }

    // old still working
    // const response = axios.post('/api/storeQuestion', {
    //   chat: currentConversation.conversationId,
    //   domanda: inputValue,
    // }).then((response) => response.data)
    //   .then((data) => {
    //     console.log("Message insert successful:", data);
    //     // Crea un nuovo messaggio
    //     const newMessage: MessageType = {
    //       id: data.currentMessage.at(0).id, // Un ID temporaneo
    //       chatId: data.currentMessage.at(0).chat, // ID della chat
    //       domanda: inputValue,
    //       risposta: "", // La risposta arriverÃ dal backend
    //     };

    //     // Aggiorna i messaggi della conversazione corrente nel frontend
    //     setCurrentConversation((prev) => {
    //       if (!prev) return null;
    //       return {
    //         ...prev,
    //         messages: [...prev.messages, newMessage],
    //       };
    //     });
    //     sendJsonMessage({ messageId: data.currentMessage.at(0).id, message: data.currentMessage.at(0).domanda });
    //   }).catch((error) => {
    //     console.error("Error sending message:", error);
    //     setIsInputDisabled(false);
    //   }).finally(() => {
    //     setInputValue(""); // Resetta l'input
    //     // setIsInputDisabled(false); // Riabilita l'input
    //   });
  }

  /**
   * Update the frontend with the response from the backend
   * @author Yixin
   * @date 2025-01-10
   * @lastmodified 2025-01-10
   * @lastmodifiedby Yixin
   */
  const onMessage = (JSONmessage: string) => {
    let messageId;
    let message;
    try {
      const data = JSON.parse(JSONmessage);
      messageId = data.messageId || -1;
      message = data.message;
    } catch (error) {
      console.error("Error parsing JSON message:", error);
      return;
    }
    // {"messageId": messageId, "message": "|start|"}
    if (message === "|start|") {
      console.log("GOT START MESSAGE");
      // Create a new message, and wait for the messages from the backend
      const botMessage: MessageType = {
        id: messageId + 2, // ID univoco
        chatId: currentConversation?.conversationId || "",
        domanda: "", // Il bot non pone domande
        risposta: "", // Risposta dal backend
      };
      setCurrentConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, botMessage],
        };



      });
      //----------------------------------------------------------------
      return;
    }

    if (message === "|end|") {
      setIsInputDisabled(false);
      console.log(currentConversation);
      return;
    }

    if (message) {
      console.log("GOT MESSAGE:", message);
      if (currentConversation && currentConversation.messages.at(-1)) {
        currentConversation.messages.at(-1)!.risposta += message;
      }
    }
  };

  /**
   * Creating new conversation
   * @author Yixin
   * @date 2025-01-06
   * @lastmodified 2025-01-06
   * @lastmodifiedby Yixin
   */
  const handleNewConversation = async () => {
    const user = await getUser()
    try {
      const response = await fetch("/api/newConversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ utente: user?.id, tipo: tab }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create chat");
      }
      console.log("Chat created successfully:", result);
      fetchAllConversations();
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const handleDeleteConversation = async (conversation: Conversation) => {
    const user = await getUser()

    console.log("Deleting chat:", conversation.conversationId);
    console.log("User:", user?.id);

    try {
      const response = await fetch("/api/deleteConversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chat_id: conversation.conversationId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete chat");
      }
      console.log("Chat deleted successfully:", result);
      fetchAllConversations();
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    return new Date(dateString).toLocaleString('it-IT', options);
  };

  const handleFeedbackClick = (type: "thumbsUp" | "thumbsDown") => {
    setSelectedFeedback((prev) => (prev === type ? null : type));
  };


  return (
    <div className={styles.mainContainer}>
      {/* Sidebar Section */}
      <div className={styles.sidebar}>
        {/* Tab Navigation */}
        {/* <div className={styles.tabNav}>
          <button
            className={`${styles.tabButton} ${tab === "free" ? styles.activeTab : ""}`}
            onClick={() => setTab("free")}
          >
            Conversazioni Libere
          </button>
          <button
            className={`${styles.tabButton} ${tab === "guide" ? styles.activeTab : ""}`}
            onClick={() => setTab("guide")}
          >
            Conversazioni Guidate
          </button>
        </div> */}
        <button className={styles.newConversationButton} onClick={handleNewConversation}>Nuova conversazione</button>

        {/* Conversation List */}
        <div className={styles.conversationList}>
          <ul>
            {conversations.map((conversation) => (
              <li
                key={conversation.conversationId}
                className={`${styles.conversationItem} ${currentConversation?.conversationId === conversation.conversationId ? styles.activeConversation : ""}`}
                onClick={() => handleConversationClick(conversation)}
              >
                {`${conversation.messages?.at(0)?.domanda || "Conversazione vuota"}`}
                <button className={`${styles.btnDelete}`} onClick={(e) => {
                  e.stopPropagation(); handleDeleteConversation(conversation);
                }}>
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Chat Section */}
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          {currentConversation ? (
            <h2>{`${tab === "free" ? "Libera" : "Guidata"} ${currentConversation.messages?.at(0)?.domanda || "Conversazione vuota"}`}</h2>
          ) : (
            <h2>Seleziona una conversazione</h2>
          )}
        </div>

        <div className={styles.chatMessages}>
          {currentConversation ? (
            <ul>
              {currentConversation.messages.map((message, index) => (
                <li key={message.id} className={styles.message}>
                  <div className={styles.userMessageContainer}>
                    {message.domanda && (
                      <div className={styles.userMessage}>{message.domanda}</div>
                    )}
                  </div>

                  <div className={styles.botMessageContainer}>
                    {message.risposta && (
                      <div className={styles.botMessage}>
                        {message.risposta}
                        {index === currentConversation.messages.length - 1 && (
                          <div className={styles.feedbackContainer}>
                            <span className={styles.messageTime}>{message.data ? formatDate(message.data) : "Adesso"}</span>
                            <div className={styles.feedbackButtons}>
                              <button
                                className={`${styles.feedbackButton} ${selectedFeedback === "thumbsUp" ? styles.selected : ""}`}
                                onClick={() => handleFeedbackClick("thumbsUp")}
                              >
                                <FontAwesomeIcon icon={faThumbsUp} className={`${styles.feedbackIcon} ${styles.thumbsUp}`} />
                              </button>
                              <button
                                className={`${styles.feedbackButton} ${selectedFeedback === "thumbsDown" ? styles.selected : ""}`}
                                onClick={() => handleFeedbackClick("thumbsDown")}
                              >
                                <FontAwesomeIcon icon={faThumbsDown} className={`${styles.feedbackIcon} ${styles.thumbsDown}`} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
              <div ref={messagesEndRef} />
            </ul>
          ) : (
            <div className={styles.noConversation}>
              <p>Seleziona una conversazione per iniziare a chattare</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className={styles.messageBar}>
          {currentConversation && (
            <>
              <div className={styles.infoContainer}>
                <div className={styles.charCount}>
                  Caratteri rimanenti: {remainingChars}
                </div>
                {containsForbiddenWords && (
                  <div className={styles.errorMessage}>
                    Il messaggio contiene parole proibite.
                  </div>
                )}
              </div>
              <div className={styles.inputContainer}>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Inserisci un messaggio..."
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} // Chiamata alla funzione con Enter
                  disabled={!currentConversation}
                  maxLength={200}
                />
                <button
                  className={styles.sendButton}
                  onClick={handleSendMessage} // Chiamata alla funzione con il pulsante
                  disabled={!currentConversation || isInputDisabled || containsForbiddenWords}
                >
                  {isInputDisabled ? "Attendi..." : "Invia"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div >
  );
};
export default Chat;
