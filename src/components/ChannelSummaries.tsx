import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Users, Clock, Hash, RefreshCw } from "lucide-react";

const ChannelSummaryCard = ({ channel }) => {
  // Calculate how old the cache is
  const cacheAge = channel.cache_age_seconds
    ? Math.floor(channel.cache_age_seconds / 3600) // Convert to hours
    : 0;

  return (
    <Card className="hover:shadow-lg transition-all hover:border-[#7C68FA]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Hash className="h-5 w-5 text-[#7C68FA]" />
          <span className="font-mono text-[#4B456E]">
            {channel.channel_name}
          </span>
        </CardTitle>
        <CardDescription>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <span className="flex items-center gap-1" title="Total Messages">
              <MessageSquare className="h-4 w-4 text-[#FA512E]" />
              {channel.message_count} messages
            </span>
            <span
              className="flex items-center gap-1"
              title="Unique Participants"
            >
              <Users className="h-4 w-4 text-[#74C5DF]" />
              {channel.unique_authors} participants
            </span>
            <span className="flex items-center gap-1" title="Most Active Time">
              <Clock className="h-4 w-4 text-[#6FABA0]" />
              Peak: {channel.most_active_hour}
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-none">
          <h4 className="text-sm font-semibold mb-2 text-[#4B456E]">
            Last 7 Days Activity:
          </h4>
          <Markdown className="prose-sm lg:prose">{channel.summary}</Markdown>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-slate-500">
        Summary generated {cacheAge} hours ago
      </CardFooter>
    </Card>
  );
};

const ChannelSummarySkeletonCard = () => (
  <Card className="border-[#E2DEFC]">
    <CardHeader>
      <Skeleton className="h-6 w-48 bg-[#E2DEFC]" />
      <div className="flex gap-4 mt-2">
        <Skeleton className="h-4 w-24 bg-[#E2DEFC]" />
        <Skeleton className="h-4 w-24 bg-[#E2DEFC]" />
        <Skeleton className="h-4 w-24 bg-[#E2DEFC]" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-2 bg-[#E2DEFC]" />
      <Skeleton className="h-4 w-3/4 mb-2 bg-[#E2DEFC]" />
      <Skeleton className="h-4 w-5/6 bg-[#E2DEFC]" />
    </CardContent>
  </Card>
);

const ChannelSummaries = ({ modalUrl }) => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchSummaries = async (forceRefresh = false) => {
    try {
      // Create URL with proper query parameter
      const url = new URL(`${modalUrl}/channel-summaries`);
      if (forceRefresh) {
        url.searchParams.set("force_refresh", "true");
      }

      console.log("Fetching summaries with URL:", url.toString()); // Debug log

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch channel summaries");
      }

      const data = await response.json();
      console.log("Received data:", data); // Debug log to verify response

      setSummaries(data.summaries);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching summaries:", err); // Debug log
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSummaries(true); // Pass true to force refresh
  };

  useEffect(() => {
    fetchSummaries();
    // Refresh cached data every 5 minutes
    const interval = setInterval(() => fetchSummaries(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [modalUrl]);

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        Error loading channel summaries: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          {lastUpdate && (
            <div className="text-sm text-slate-600">
              Last updated: {lastUpdate}
            </div>
          )}
          {refreshing && (
            <div className="text-sm text-[#7C68FA]">
              Generating fresh summaries...
            </div>
          )}
        </div>
        {/* <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="ml-auto bg-[#7C68FA] hover:bg-[#4B456E]"
          variant="outline"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh Summaries"}
        </Button> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <ChannelSummarySkeletonCard key={i} />)
          : summaries
              .filter(
                (channel) =>
                  channel.channel_name !== "dots-admin" &&
                  channel.channel_name !== "customer-whitelabel",
              )
              .sort((a, b) => b.message_count - a.message_count)
              .map((channel) => (
                <ChannelSummaryCard
                  key={channel.channel_id}
                  channel={channel}
                />
              ))}
      </div>
      {!loading && summaries.length === 0 && (
        <div className="text-center py-8 text-slate-600">
          No channel activity found in the past week.
        </div>
      )}
    </div>
  );
  // return (
  //   <div className="space-y-4">
  //     <div className="flex justify-between items-center mb-4">
  //       <div className="space-y-1">
  //         {lastUpdate && (
  //           <div className="text-sm text-muted-foreground">
  //             Last updated: {lastUpdate}
  //           </div>
  //         )}
  //         {refreshing && (
  //           <div className="text-sm text-muted-foreground">
  //             Generating fresh summaries...
  //           </div>
  //         )}
  //       </div>
  //       <Button
  //         onClick={handleRefresh}
  //         disabled={refreshing}
  //         className="ml-auto"
  //         variant="outline"
  //       >
  //         <RefreshCw
  //           className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
  //         />
  //         {refreshing ? "Refreshing..." : "Refresh Summaries"}
  //       </Button>
  //     </div>

  //     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //       {loading
  //         ? Array(4)
  //             .fill(0)
  //             .map((_, i) => <ChannelSummarySkeletonCard key={i} />)
  //         : summaries
  //             .filter(
  //               (channel) =>
  //                 channel.channel_name !== "dots-admin" &&
  //                 channel.channel_name !== "customer-whitelabel",
  //             )
  //             .sort((a, b) => b.message_count - a.message_count)
  //             .map((channel) => (
  //               <ChannelSummaryCard
  //                 key={channel.channel_id}
  //                 channel={channel}
  //               />
  //             ))}
  //     </div>
  //     {!loading && summaries.length === 0 && (
  //       <div className="text-center py-8 text-muted-foreground">
  //         No channel activity found in the past week.
  //       </div>
  //     )}
  //   </div>
  // );
};

export default ChannelSummaries;
// import React, { useState, useEffect } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
//   CardFooter,
// } from "@/components/ui/card";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";
// import { MessageSquare, Users, Clock, Hash, RefreshCw } from "lucide-react";

// const ChannelSummaries = ({ modalUrl }) => {
//   const [summaries, setSummaries] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [lastUpdate, setLastUpdate] = useState(null);

//   const fetchSummaries = async (forceRefresh = false) => {
//     try {
//       const response = await fetch(
//         `${modalUrl}/channel-summaries${forceRefresh ? "?force_refresh=true" : ""}`,
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch channel summaries");
//       }
//       const data = await response.json();
//       setSummaries(data.summaries);
//       setLastUpdate(new Date().toLocaleTimeString());
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const handleRefresh = async () => {
//     setRefreshing(true);
//     await fetchSummaries(true);
//   };

//   useEffect(() => {
//     fetchSummaries();
//     // Refresh cached data every 5 minutes
//     const interval = setInterval(() => fetchSummaries(), 5 * 60 * 1000);
//     return () => clearInterval(interval);
//   }, [modalUrl]);

//   if (error) {
//     return (
//       <div className="p-4 text-red-500 bg-red-50 rounded-lg">
//         Error loading channel summaries: {error}
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       <div className="flex justify-between items-center mb-4">
//         {lastUpdate && (
//           <div className="text-sm text-muted-foreground">
//             Last updated: {lastUpdate}
//           </div>
//         )}
//         <Button
//           onClick={handleRefresh}
//           disabled={refreshing}
//           className="ml-auto"
//           variant="outline"
//         >
//           <RefreshCw
//             className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
//           />
//           {refreshing ? "Refreshing..." : "Refresh Summaries"}
//         </Button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {loading
//           ? Array(4)
//               .fill(0)
//               .map((_, i) => <ChannelSummarySkeletonCard key={i} />)
//           : summaries
//               .sort((a, b) => b.message_count - a.message_count)
//               .map((channel) => (
//                 <ChannelSummaryCard
//                   key={channel.channel_id}
//                   channel={channel}
//                 />
//               ))}
//       </div>

//       {!loading && summaries.length === 0 && (
//         <div className="text-center py-8 text-muted-foreground">
//           No channel activity found in the past week.
//         </div>
//       )}
//     </div>
//   );
// };

// export default ChannelSummaries;
// // import React, { useState, useEffect } from "react";
// // import {
// //   Card,
// //   CardContent,
// //   CardDescription,
// //   CardHeader,
// //   CardTitle,
// // } from "@/components/ui/card";
// // import { ScrollArea } from "@/components/ui/scroll-area";
// // import { MessageSquare, Users, Clock } from "lucide-react";

// // const ChannelSummaries = ({ modalUrl }) => {
// //   const [summaries, setSummaries] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   useEffect(() => {
// //     const fetchSummaries = async () => {
// //       try {
// //         const response = await fetch(`${modalUrl}/channel-summaries`);
// //         const data = await response.json();
// //         if (!response.ok)
// //           throw new Error(data.error || "Failed to fetch summaries");
// //         setSummaries(data.summaries);
// //       } catch (err) {
// //         setError(err.message);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchSummaries();
// //   }, [modalUrl]);

// //   if (loading)
// //     return <div className="text-center py-8">Loading channel summaries...</div>;
// //   if (error) return <div className="text-red-500 py-8">Error: {error}</div>;

// //   return (
// //     <ScrollArea className="h-[calc(100vh-12rem)]">
// //       <div className="space-y-6 p-4">
// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //           {summaries.map((channel) => (
// //             <Card
// //               key={channel.channel_id}
// //               className="hover:shadow-lg transition-shadow"
// //             >
// //               <CardHeader>
// //                 <CardTitle className="flex items-center gap-2">
// //                   <MessageSquare className="h-5 w-5" />#{channel.channel_name}
// //                 </CardTitle>
// //                 <CardDescription>
// //                   <div className="flex items-center gap-4 mt-2">
// //                     <span className="flex items-center gap-1">
// //                       <MessageSquare className="h-4 w-4" />
// //                       {channel.message_count} messages
// //                     </span>
// //                     <span className="flex items-center gap-1">
// //                       <Users className="h-4 w-4" />
// //                       {channel.unique_authors} participants
// //                     </span>
// //                     <span className="flex items-center gap-1">
// //                       <Clock className="h-4 w-4" />
// //                       Peak: {channel.most_active_hour}
// //                     </span>
// //                   </div>
// //                 </CardDescription>
// //               </CardHeader>
// //               <CardContent>
// //                 <div className="prose prose-sm">
// //                   <h4 className="text-sm font-semibold mb-2">
// //                     Last 7 Days Summary:
// //                   </h4>
// //                   <div className="whitespace-pre-wrap text-sm">
// //                     {channel.summary}
// //                   </div>
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           ))}
// //         </div>
// //       </div>
// //     </ScrollArea>
// //   );
// // };

// // export default ChannelSummaries;
