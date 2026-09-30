"use client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      <div className="bg-white p-6 rounded-xl shadow border space-y-4">
        <div><strong>Name:</strong> {user.name}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Role:</strong> {user.role}</div>
        <Button onClick={logout} variant="destructive">Logout</Button>
      </div>
    </div>
  );
}
