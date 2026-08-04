import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";

export default function AccessDeniedPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-lg border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Staff access is required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
          <p>
            Your account is authenticated, but it has not been assigned an inventory staff role.
            Ask an administrator to add your email to the staff allowlist or update your database role.
          </p>
          <Button asChild>
            <Link href="/login">Return to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
