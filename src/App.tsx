import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, MessageSquare, Database, Share2, RefreshCw } from "lucide-react";
import ChannelSummaries from "@/components/ChannelSummaries";
import Header from "@/components/Tenstorrent";

// Tenstorrent color palette constants
const COLORS = {
  primaryPurple: "#7C68FA", // Main accent color
  purpleDark: "#4B456E", // Text and secondary elements
  purpleLight: "#E2DEFC", // Backgrounds and subtle elements
  redAccent: "#FA512E", // Important indicators
  tealAccent: "#74C5DF", // User-related information
  greenAccent: "#6FABA0", // Time-related information
  slateLight: "#EDEFF9", // Background gradient start
};

// Component for visualizing data processing steps
const DataFlowStep = ({ title, description, icon: Icon, children }) => (
  <Card className="mb-4 border-slate-200 hover:border-[#7C68FA] transition-colors">
    <CardHeader>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#7C68FA]" />
        <CardTitle className="text-lg text-[#4B456E]">{title}</CardTitle>
      </div>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

// Component for displaying conversation history
const MessageHistory = ({ messages }) => (
  <ScrollArea className="h-96">
    <div className="space-y-4">
      {messages?.map((message, idx) => (
        <div key={idx} className="rounded-lg bg-slate-50 p-4">
          <div className="font-semibold mb-2 text-[#4B456E]">
            {message.role}
          </div>
          <div className="whitespace-pre-wrap">{message.content}</div>
          {message.tool_calls && (
            <div className="mt-2 p-2 bg-[#E2DEFC] rounded">
              <div className="font-semibold">Tool Call:</div>
              <div>{message.tool_calls[0].function.name}</div>
              <div className="font-mono text-sm mt-1">
                {message.tool_calls[0].function.arguments}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </ScrollArea>
);

// Main application component
const App = () => {
  // State management for various features
  const [query, setQuery] = useState("");
  const [guildId, setGuildId] = useState("");
  const [messageLimit, setMessageLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [summaries, setSummaries] = useState(null);

  // Get Modal URL from environment variables
  const modalUrl = import.meta.env.VITE_MODAL_URL;

  // Password login screen
  const [authenticated, setAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Temporary solution for preventing cold-starts on Modal
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${modalUrl}/`).catch((err) =>
        console.log("Warm-up request failed:", err)
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${modalUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: inputPassword }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      if (data.authenticated) {
        setAuthenticated(true);
      } else {
        alert("Incorrect password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred during login.");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EDEFF9] to-white flex flex-col">
        <div className="container mx-auto py-6 max-w-6xl">
          <Header />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <form
            onSubmit={handleLogin}
            className="bg-white p-6 rounded shadow-md max-w-md w-full"
          >
            <h2 className="text-xl mb-4 text-[#4B456E] font-semibold text-center">
              Enter Password to Continue
            </h2>
            <input
              type="password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              className="border border-gray-300 p-2 w-full mb-4 rounded"
              placeholder="Password"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#7C68FA] hover:bg-[#4B456E] text-white px-4 py-2 rounded w-full flex items-center justify-center"
            >
              {isSubmitting && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isSubmitting ? "Authenticating..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Handler for submitting queries to the Discord analysis system
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${modalUrl}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler for initiating Discord server scraping
  const handleScrape = async (e) => {
    e.preventDefault();
    setScraping(true);
    setError(null);

    try {
      const response = await fetch(
        `${modalUrl}/discord/${guildId}?limit=${messageLimit}`,
        { method: "POST" },
      );
      console.log("Fetching Discord URL:", `${modalUrl}/discord/${guildId}?limit=${messageLimit}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape server");
      }
      alert("Server scraped successfully!");
      console.log("Server scraped successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EDEFF9] to-white">
      <div className="container mx-auto py-6 max-w-6xl">
        {/* Header section with logo and title */}
        <Header />

        {/* Main content tabs */}
        <Tabs defaultValue="summaries" className="mb-6">
          <TabsList className="bg-[#E2DEFC]">
            <TabsTrigger
              value="summaries"
              className="data-[state=active]:bg-[#7C68FA] data-[state=active]:text-white"
            >
              Channel Summaries
            </TabsTrigger>
            <TabsTrigger
              value="query"
              className="data-[state=active]:bg-[#7C68FA] data-[state=active]:text-white"
            >
              Custom Query
            </TabsTrigger>
          </TabsList>

          {/* Channel Summaries Tab Content */}
          <TabsContent value="summaries">
            <Card className="mb-6 border-[#BCB3F7]">
              <CardHeader>
                <CardTitle className="text-[#4B456E]">
                  Weekly Channel Summaries
                </CardTitle>
                <CardDescription>
                  Overview of discussions and activity in each channel over the
                  past week.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChannelSummaries
                  modalUrl={modalUrl}
                  summaries={summaries}
                  setSummaries={setSummaries}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Query Tab Content */}
          <TabsContent value="query">
            {/* Server Scraping Configuration */}
            {/* <Card className="mb-6 border-[#BCB3F7]">
              <CardHeader>
                <CardTitle className="text-[#4B456E]">
                  Discord Server Scraper
                </CardTitle>
                <CardDescription>
                  Configure and initiate Discord server data scraping
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleScrape} className="flex gap-4">
                  <Input
                    value={guildId}
                    onChange={(e) => setGuildId(e.target.value)}
                    placeholder="Discord Server ID"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={messageLimit}
                    onChange={(e) => setMessageLimit(parseInt(e.target.value))}
                    placeholder="Message Limit"
                    className="w-32"
                  />
                  <Button
                    type="submit"
                    disabled={scraping}
                    className="bg-[#7C68FA] hover:bg-[#4B456E]"
                  >
                    {scraping ? "Scraping..." : "Scrape Server"}
                  </Button>
                </form>
              </CardContent>
            </Card> */}

            {/* Query Input Form */}
            <form onSubmit={handleSubmit} className="mb-6 mt-2">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about the Discord data..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#7C68FA] hover:bg-[#4B456E] flex items-center justify-center"
                >
                  {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  {loading ? "Processing..." : "Submit"}
                </Button>
              </div>
            </form>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Query Results Display */}
            {result && (
              <div className="space-y-6">
                {/* Final Answer Card */}
                <Card className="border-2 border-[#7C68FA]">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#4B456E]">
                      Final Answer
                    </CardTitle>
                    <CardDescription>
                      The system's response to your query
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-[#E2DEFC] p-4 rounded-lg whitespace-pre-wrap">
                      {result.answer}
                    </div>
                  </CardContent>
                </Card>

                {/* Query Analysis Process Steps */}
                {/* <DataFlowStep
                  title="1. Query Analysis"
                  description="The system analyzes your query to determine the best approach"
                  icon={MessageSquare}
                >
                  <div className="font-mono text-sm bg-[#E2DEFC] p-4 rounded">
                    Query: {query}
                  </div>
                </DataFlowStep>

                <DataFlowStep
                  title="2. Processing Approach"
                  description="Based on the query, the system chose either RAG or SQL processing"
                  icon={Share2}
                >
                  <div className="bg-[#E2DEFC] p-4 rounded">
                    <span className="font-semibold">Selected Approach: </span>
                    {result.chat_history
                      .find((m) => m.tool_calls)
                      ?.tool_calls[0]?.function?.arguments.includes(
                        '"approach":"sql"',
                      )
                      ? "SQL Query Generation"
                      : "RAG Similarity Search"}
                  </div>
                </DataFlowStep> */}

                {/* SQL Query Step (if applicable) */}
                {/* {result.chat_history
                  .find((m) => m.tool_calls)
                  ?.tool_calls[0]?.function?.arguments.includes(
                    '"approach":"sql"',
                  ) && (
                  <DataFlowStep
                    title="3. Generated SQL"
                    description="The SQL query generated to answer your question"
                    icon={Database}
                  >
                    <pre className="bg-[#E2DEFC] p-4 rounded overflow-x-auto">
                      <code>
                        {
                          JSON.parse(
                            result.chat_history.find((m) => m.tool_calls)
                              ?.tool_calls[0]?.function?.arguments || "{}",
                          ).sql_query
                        }
                      </code>
                    </pre>
                  </DataFlowStep>
                )} */}

                {/* Complete Interaction Flow */}
                {/* <DataFlowStep
                  title="4. Complete Interaction Flow"
                  description="The full conversation and data flow between components"
                  icon={Code}
                >
                  <Tabs defaultValue="messages">
                    <TabsList className="bg-[#E2DEFC]">
                      <TabsTrigger
                        value="messages"
                        className="data-[state=active]:bg-[#7C68FA] data-[state=active]:text-white"
                      >
                        Message History
                      </TabsTrigger>
                      <TabsTrigger
                        value="raw"
                        className="data-[state=active]:bg-[#7C68FA] data-[state=active]:text-white"
                      >
                        Raw Response
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="messages">
                      <MessageHistory messages={result.chat_history} />
                    </TabsContent>
                    <TabsContent value="raw">
                      <ScrollArea className="h-96">
                        <pre className="bg-[#E2DEFC] p-4 rounded text-sm">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </DataFlowStep> */}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default App;
// import React, { useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Code, MessageSquare, Database, Share2 } from "lucide-react";
// import ChannelSummaries from "@/components/ChannelSummaries";

// // DataFlowStep is a reusable component for visualizing the processing steps
// // It displays a titled card with an icon and description of each step in the query process
// const DataFlowStep = ({ title, description, icon: Icon, children }) => (
//   <Card className="mb-4 border-slate-200 hover:border-[#7C68FA] transition-colors">
//     <CardHeader>
//       <div className="flex items-center gap-2">
//         <Icon className="h-5 w-5 text-[#7C68FA]" />
//         <CardTitle className="text-lg text-[#4B456E]">{title}</CardTitle>
//       </div>
//       <CardDescription>{description}</CardDescription>
//     </CardHeader>
//     <CardContent>{children}</CardContent>
//   </Card>
// );

// const MessageHistory = ({ messages }) => (
//   <ScrollArea className="h-96">
//     <div className="space-y-4">
//       {messages?.map((message, idx) => (
//         <div key={idx} className="rounded-lg bg-slate-50 p-4">
//           <div className="font-semibold mb-2 text-[#4B456E]">
//             {message.role}
//           </div>
//           <div className="whitespace-pre-wrap">{message.content}</div>
//           {message.tool_calls && (
//             <div className="mt-2 p-2 bg-[#E2DEFC] rounded">
//               <div className="font-semibold">Tool Call:</div>
//               <div>{message.tool_calls[0].function.name}</div>
//               <div className="font-mono text-sm mt-1">
//                 {message.tool_calls[0].function.arguments}
//               </div>
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   </ScrollArea>
// );
// // const DataFlowStep = ({ title, description, icon: Icon, children }) => (
// //   <Card className="mb-4">
// //     <CardHeader>
// //       <div className="flex items-center gap-2">
// //         <Icon className="h-5 w-5" />
// //         <CardTitle className="text-lg">{title}</CardTitle>
// //       </div>
// //       <CardDescription>{description}</CardDescription>
// //     </CardHeader>
// //     <CardContent>{children}</CardContent>
// //   </Card>
// // );

// // // MessageHistory component displays the conversation flow between the user and the AI
// // // It shows each message, including tool calls and their arguments
// // const MessageHistory = ({ messages }) => (
// //   <ScrollArea className="h-96">
// //     <div className="space-y-4">
// //       {messages?.map((message, idx) => (
// //         <div key={idx} className="rounded-lg bg-muted p-4">
// //           <div className="font-semibold mb-2">{message.role}</div>
// //           <div className="whitespace-pre-wrap">{message.content}</div>
// //           {message.tool_calls && (
// //             <div className="mt-2 p-2 bg-secondary rounded">
// //               <div className="font-semibold">Tool Call:</div>
// //               <div>{message.tool_calls[0].function.name}</div>
// //               <div className="font-mono text-sm mt-1">
// //                 {message.tool_calls[0].function.arguments}
// //               </div>
// //             </div>
// //           )}
// //         </div>
// //       ))}
// //     </div>
// //   </ScrollArea>
// // );

// const App = () => {
//   // State management for the application
//   const [query, setQuery] = useState("");
//   const [guildId, setGuildId] = useState("");
//   const [messageLimit, setMessageLimit] = useState(100);
//   const [loading, setLoading] = useState(false);
//   const [scraping, setScraping] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState(null);

//   // Get the Modal URL from environment variables
//   const modalUrl = import.meta.env.VITE_MODAL_URL;

//   // Handler for submitting queries to the Discord analysis system
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await fetch(`${modalUrl}/ask`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ query }),
//       });

//       const data = await response.json();
//       if (data.error) {
//         throw new Error(data.error);
//       }
//       setResult(data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handler for scraping a Discord server
//   const handleScrape = async (e) => {
//     e.preventDefault();
//     setScraping(true);
//     setError(null);

//     try {
//       const response = await fetch(
//         `${modalUrl}/discord/${guildId}?limit=${messageLimit}`,
//         { method: "POST" },
//       );
//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || "Failed to scrape server");
//       }
//       alert("Server scraped successfully!");
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setScraping(false);
//     }
//   };

//   return (
//     <div className="container mx-auto py-6 max-w-6xl">
//       <h1 className="text-3xl font-bold mb-6">Discord Channel Analysis</h1>

//       <Tabs defaultValue="summaries" className="mb-6">
//         <TabsList>
//           <TabsTrigger value="summaries">Channel Summaries</TabsTrigger>
//           <TabsTrigger value="query">Custom Query</TabsTrigger>
//         </TabsList>

//         {/* Channel Summaries Tab */}
//         <TabsContent value="summaries">
//           <Card className="mb-6">
//             <CardHeader>
//               <CardTitle>Weekly Channel Summaries</CardTitle>
//               <CardDescription>
//                 Overview of discussions and activity in each channel over the
//                 past week
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <ChannelSummaries modalUrl={modalUrl} />
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Custom Query Tab */}
//         <TabsContent value="query">
//           {/* Server Scraping Configuration */}
//           <Card className="mb-6">
//             <CardHeader>
//               <CardTitle>Discord Server Scraper</CardTitle>
//               <CardDescription>
//                 Configure and initiate Discord server data scraping
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <form onSubmit={handleScrape} className="flex gap-4">
//                 <Input
//                   value={guildId}
//                   onChange={(e) => setGuildId(e.target.value)}
//                   placeholder="Discord Server ID"
//                   className="flex-1"
//                 />
//                 <Input
//                   type="number"
//                   value={messageLimit}
//                   onChange={(e) => setMessageLimit(parseInt(e.target.value))}
//                   placeholder="Message Limit"
//                   className="w-32"
//                 />
//                 <Button type="submit" disabled={scraping}>
//                   {scraping ? "Scraping..." : "Scrape Server"}
//                 </Button>
//               </form>
//             </CardContent>
//           </Card>

//           {/* Query Input Form */}
//           <form onSubmit={handleSubmit} className="mb-6">
//             <div className="flex gap-2">
//               <Input
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 placeholder="Ask a question about the Discord data..."
//                 className="flex-1"
//               />
//               <Button type="submit" disabled={loading}>
//                 {loading ? "Processing..." : "Submit"}
//               </Button>
//             </div>
//           </form>

//           {/* Error Display */}
//           {error && (
//             <Alert variant="destructive" className="mb-6">
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//           )}

//           {/* Query Results Display */}
//           {result && (
//             <div className="space-y-6">
//               <Card className="border-2 border-primary">
//                 <CardHeader>
//                   <CardTitle className="text-xl">Final Answer</CardTitle>
//                   <CardDescription>
//                     The system's response to your query
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
//                     {result.answer}
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Query Analysis Step */}
//               <DataFlowStep
//                 title="1. Query Analysis"
//                 description="The system analyzes your query to determine the best approach (RAG or SQL)"
//                 icon={MessageSquare}
//               >
//                 <div className="font-mono text-sm bg-muted p-4 rounded">
//                   Query: {query}
//                 </div>
//               </DataFlowStep>

//               {/* Processing Approach Step */}
//               <DataFlowStep
//                 title="2. Processing Approach"
//                 description="Based on the query, the system chose either RAG or SQL processing"
//                 icon={Share2}
//               >
//                 <div className="bg-muted p-4 rounded">
//                   <span className="font-semibold">Selected Approach: </span>
//                   {result.chat_history
//                     .find((m) => m.tool_calls)
//                     ?.tool_calls[0]?.function?.arguments.includes(
//                       '"approach":"sql"',
//                     )
//                     ? "SQL Query Generation"
//                     : "RAG Similarity Search"}
//                 </div>
//               </DataFlowStep>

//               {/* SQL Query Step (if applicable) */}
//               {result.chat_history
//                 .find((m) => m.tool_calls)
//                 ?.tool_calls[0]?.function?.arguments.includes(
//                   '"approach":"sql"',
//                 ) && (
//                 <DataFlowStep
//                   title="3. Generated SQL"
//                   description="The SQL query generated to answer your question"
//                   icon={Database}
//                 >
//                   <pre className="bg-muted p-4 rounded overflow-x-auto">
//                     <code>
//                       {
//                         JSON.parse(
//                           result.chat_history.find((m) => m.tool_calls)
//                             ?.tool_calls[0]?.function?.arguments || "{}",
//                         ).sql_query
//                       }
//                     </code>
//                   </pre>
//                 </DataFlowStep>
//               )}

//               {/* Complete Interaction Flow */}
//               <DataFlowStep
//                 title="4. Complete Interaction Flow"
//                 description="The full conversation and data flow between components"
//                 icon={Code}
//               >
//                 <Tabs defaultValue="messages">
//                   <TabsList>
//                     <TabsTrigger value="messages">Message History</TabsTrigger>
//                     <TabsTrigger value="raw">Raw Response</TabsTrigger>
//                   </TabsList>
//                   <TabsContent value="messages">
//                     <MessageHistory messages={result.chat_history} />
//                   </TabsContent>
//                   <TabsContent value="raw">
//                     <ScrollArea className="h-96">
//                       <pre className="bg-muted p-4 rounded text-sm">
//                         {JSON.stringify(result, null, 2)}
//                       </pre>
//                     </ScrollArea>
//                   </TabsContent>
//                 </Tabs>
//               </DataFlowStep>
//             </div>
//           )}
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// };

// export default App;
