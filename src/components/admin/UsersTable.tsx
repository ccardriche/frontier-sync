import { format } from "date-fns";
import { Users, Star, Wallet, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  roles: Database["public"]["Enums"]["app_role"][];
};

interface UsersTableProps {
  users: Profile[] | undefined;
  isLoading: boolean;
}

const roleColors: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/30",
  shipper: "bg-primary/10 text-primary border-primary/30",
  driver: "bg-success/10 text-success border-success/30",
  gig_worker: "bg-warning/10 text-warning border-warning/30",
  landowner: "bg-accent/10 text-accent border-accent/30",
};

export function UsersTable({ users, isLoading }: UsersTableProps) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          All Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading users...</p>
        ) : users?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{user.phone || "No phone"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="text-muted-foreground text-sm">No roles</span>
                        ) : (
                          user.roles.map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium border ${roleColors[role] || "bg-muted"}`}
                            >
                              {role.replace("_", " ")}
                            </span>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        <span>{user.rating?.toFixed(1) || "5.0"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span>${((user.wallet_balance_cents || 0) / 100).toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.verified ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
