import BottomNav from "@/components/BottomNav";
import GroupGuard from "@/components/GroupGuard";
import NoticeModal from "@/components/NoticeModal";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GroupGuard />
      <div className="flex-1 pb-[100px]">{children}</div>
      <BottomNav />
      <NoticeModal />
    </>
  );
}
