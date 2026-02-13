import FriendsList, { Friend } from "@/components/friends/list";

export default function FriendsPreviewPage() {
  const friends: Friend[] = [
    { id: "1111-2222", name: "Natalie", threadId: "t1" },
    { id: "3333-4444", name: "Abhiram", threadId: "t2" },
  ];

  return (
    <main className="p-6">
      <FriendsList
        friends={friends}
        // 这行先用默认的 /profile/${id}
        // 之后你要改成“discover 卡片”用的那种 profile 链接格式
      />
    </main>
  );
}