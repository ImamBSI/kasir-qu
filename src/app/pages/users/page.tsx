import { getUserManagerData } from "@/lib/userManagement";
import UserManagerClient from "./UserManagerClient";

export default async function UserManagerPage() {
  const { currentUserId, users } = await getUserManagerData();
  return <UserManagerClient currentUserId={currentUserId} users={users} />;
}
