import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { ShieldAlert, Users, History, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default function Settings() {
    const { isSuperAdmin, isAdmin } = useAuth()
    const [users, setUsers] = useState<any[]>([])
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isAdmin) {
            fetchData()
        }
    }, [isAdmin])

    const fetchData = async () => {
        try {
            setLoading(true)
            // Fetch Users
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name')

            if (usersError) throw usersError
            setUsers(usersData || [])

            // Fetch Audit Logs (Admins see specific logs, SuperAdmins see all)
            let logsQuery = supabase
                .from('audit_logs')
                .select(`
                    *,
                    profiles:user_id (full_name, role)
                `)
                .order('created_at', { ascending: false })
                .limit(100)

            // Simple filter for Admins if needed later, right now let's just fetch all they have access to via RLS
            const { data: logsData, error: logsError } = await logsQuery

            if (logsError) throw logsError
            setAuditLogs(logsData || [])

        } catch (error) {
            console.error("Error fetching settings data:", error)
        } finally {
            setLoading(false)
        }
    }

    if (!isAdmin) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                <ShieldAlert className="h-16 w-16 text-destructive" />
                <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
                <p className="text-muted-foreground">You don't have permission to view settings.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            </div>

            <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="users">
                        <Users className="mr-2 h-4 w-4" />
                        User Management
                    </TabsTrigger>
                    <TabsTrigger value="audit">
                        <History className="mr-2 h-4 w-4" />
                        Audit Logs
                    </TabsTrigger>
                    {isSuperAdmin && (
                        <TabsTrigger value="system">
                            System Config
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Users</CardTitle>
                            <CardDescription>
                                Manage system users and their roles.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Last Updated</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((u) => (
                                                <TableRow key={u.id}>
                                                    <TableCell className="font-medium">{u.full_name || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={u.role === 'super_admin' ? 'destructive' : u.role === 'admin' ? 'default' : 'secondary'}>
                                                            {u.role.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{u.updated_at ? format(new Date(u.updated_at), 'PPP') : 'Never'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Audit Logs</CardTitle>
                            <CardDescription>
                                Review system activity and user actions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="rounded-md border h-[500px] overflow-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background z-10">
                                            <TableRow>
                                                <TableHead>Time</TableHead>
                                                <TableHead>User</TableHead>
                                                <TableHead>Action</TableHead>
                                                <TableHead>Entity</TableHead>
                                                <TableHead>Details</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {auditLogs.map((log) => (
                                                <TableRow key={log.id}>
                                                    <TableCell className="whitespace-nowrap text-xs">
                                                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {log.profiles?.full_name || 'System User'}
                                                        <br />
                                                        <span className="text-xs text-muted-foreground">{log.profiles?.role || ''}</span>
                                                    </TableCell>
                                                    <TableCell>{log.action}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{log.entity_type}</Badge>
                                                        {log.entity_id && <span className="text-xs ml-1 text-muted-foreground">#{log.entity_id.substring(0, 8)}</span>}
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate" title={JSON.stringify(log.details)}>
                                                        {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {auditLogs.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No audit logs found.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {isSuperAdmin && (
                    <TabsContent value="system" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>System Configuration</CardTitle>
                                <CardDescription>
                                    Advanced system settings (Super Admin only).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center h-32 text-muted-foreground">
                                    System configuration options will be implemented here.
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
