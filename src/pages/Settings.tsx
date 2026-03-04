import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { ShieldAlert, Users, History, Loader2, Plus, Eye, EyeOff, Shield, ShieldOff, Trash2, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function Settings() {
    const { isSuperAdmin, isAdmin } = useAuth()
    const { toast } = useToast()
    const [users, setUsers] = useState<any[]>([])
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Add user dialog state
    const [addUserOpen, setAddUserOpen] = useState(false)
    const [addUserLoading, setAddUserLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [newUser, setNewUser] = useState({
        full_name: "",
        email: "",
        password: "",
        role: "manager" as "super_admin" | "admin" | "manager" | "pending",
    })

    // Delete user confirmation state
    const [deleteUserConfirm, setDeleteUserConfirm] = useState<{ open: boolean, userId: string, email: string }>({
        open: false,
        userId: "",
        email: ""
    })
    const [deleteLoading, setDeleteLoading] = useState(false)

    useEffect(() => {
        if (isAdmin) {
            fetchData()
        }
    }, [isAdmin])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name')

            if (usersError) throw usersError
            setUsers(usersData || [])

            const logsQuery = supabase
                .from('audit_logs')
                .select(`
                    *,
                    profiles:user_id (full_name, role)
                `)
                .order('created_at', { ascending: false })
                .limit(100)

            const { data: logsData, error: logsError } = await logsQuery
            if (logsError) throw logsError
            setAuditLogs(logsData || [])

        } catch (error) {
            console.error("Error fetching settings data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddUser = async () => {
        if (!newUser.email || !newUser.password || !newUser.role) {
            toast({ title: "Missing fields", description: "Email, password, and role are required.", variant: "destructive" })
            return
        }
        if (newUser.password.length < 8) {
            toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" })
            return
        }

        try {
            setAddUserLoading(true)
            const { data, error } = await supabase.functions.invoke("create-user", {
                body: {
                    email: newUser.email,
                    password: newUser.password,
                    full_name: newUser.full_name,
                    role: newUser.role,
                },
            })

            if (error) throw error
            if (data?.error) throw new Error(data.error)

            toast({ title: "User created!", description: `${newUser.email} has been added as ${newUser.role.replace('_', ' ')}.` })
            setAddUserOpen(false)
            setNewUser({ full_name: "", email: "", password: "", role: "manager" })
            // Refresh user list
            fetchData()
        } catch (err: any) {
            toast({ title: "Failed to create user", description: err.message, variant: "destructive" })
        } finally {
            setAddUserLoading(false)
        }
    }

    const handleUpdateUserRole = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole as any, updated_at: new Date().toISOString() })
                .eq('id', userId)

            if (error) throw error
            toast({ title: "Role updated", description: "User role has been updated successfully." })
            fetchData()
        } catch (err: any) {
            toast({ title: "Update failed", description: err.message, variant: "destructive" })
        }
    }

    const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_blocked: !currentBlocked, updated_at: new Date().toISOString() })
                .eq('id', userId)

            if (error) throw error
            toast({
                title: currentBlocked ? "User unblocked" : "User blocked",
                description: `User has been ${currentBlocked ? 'unblocked' : 'blocked'} successfully.`
            })
            fetchData()
        } catch (err: any) {
            toast({ title: "Action failed", description: err.message, variant: "destructive" })
        }
    }

    const handleDeleteUser = async () => {
        if (!deleteUserConfirm.userId) return

        try {
            setDeleteLoading(true)
            const { data, error } = await supabase.functions.invoke("delete-user", {
                body: { userId: deleteUserConfirm.userId },
            })

            if (error) throw error
            if (data?.error) throw new Error(data.error)

            toast({ title: "User deleted", description: "The user has been permanently removed." })
            setDeleteUserConfirm({ open: false, userId: "", email: "" })
            fetchData()
        } catch (err: any) {
            toast({ title: "Deletion failed", description: err.message, variant: "destructive" })
        } finally {
            setDeleteLoading(false)
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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Users</CardTitle>
                                <CardDescription>
                                    Manage system users and their roles.
                                </CardDescription>
                            </div>
                            <Button onClick={() => setAddUserOpen(true)} className="gradient-primary">
                                <Plus className="mr-2 h-4 w-4" />
                                Add User
                            </Button>
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
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                                        No users found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {users.map((u) => (
                                                <TableRow key={u.id}>
                                                    <TableCell className="font-medium">{u.full_name || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Select
                                                            defaultValue={u.role}
                                                            onValueChange={(v) => handleUpdateUserRole(u.id, v)}
                                                            disabled={!isSuperAdmin && u.role === 'super_admin'}
                                                        >
                                                            <SelectTrigger className="w-[140px] h-8">
                                                                <SelectValue>
                                                                    <Badge variant={u.role === 'super_admin' ? 'destructive' : u.role === 'admin' ? 'default' : u.role === 'pending' ? 'outline' : 'secondary'} className="border-none p-0">
                                                                        {u.role.replace('_', ' ')}
                                                                    </Badge>
                                                                </SelectValue>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">Pending</SelectItem>
                                                                <SelectItem value="manager">Manager</SelectItem>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                                {isSuperAdmin && (
                                                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>{u.updated_at ? format(new Date(u.updated_at), 'PPP') : 'Never'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className={`h-8 w-8 ${u.is_blocked ? 'text-destructive hover:text-destructive' : 'text-muted-foreground'}`}
                                                                title={u.is_blocked ? "Unblock user" : "Block user"}
                                                                onClick={() => handleToggleBlock(u.id, u.is_blocked)}
                                                            >
                                                                {u.is_blocked ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                                                            </Button>
                                                            {isSuperAdmin && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:border-destructive/30"
                                                                    title="Delete user"
                                                                    onClick={() => setDeleteUserConfirm({ open: true, userId: u.id, email: u.full_name || 'this user' })}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
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

            {/* Add User Dialog */}
            <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                            Create a new system user. They will be able to log in immediately with the credentials you provide.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                placeholder="e.g. Amina Yusuf"
                                value={newUser.full_name}
                                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min. 8 characters"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={newUser.role}
                                onValueChange={(v) => setNewUser({ ...newUser, role: v as any })}
                            >
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    {isSuperAdmin && (
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {newUser.role === 'manager' && 'Managers can create orders and record payments, but cannot approve them.'}
                                {newUser.role === 'admin' && 'Admins have full operational access including approvals and reporting.'}
                                {newUser.role === 'super_admin' && 'Super Admins have unrestricted access to all system features.'}
                            </p>
                        </div>
                        <Button
                            className="w-full gradient-primary"
                            onClick={handleAddUser}
                            disabled={addUserLoading || !newUser.email || !newUser.password}
                        >
                            {addUserLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating User...</>
                            ) : (
                                <><Plus className="mr-2 h-4 w-4" /> Create User</>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Delete User Confirmation Dialog */}
            <Dialog open={deleteUserConfirm.open} onOpenChange={(open) => setDeleteUserConfirm({ ...deleteUserConfirm, open })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Permanent Deletion
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-bold text-foreground">{deleteUserConfirm.email}</span>? This action cannot be undone and will remove all their access to the system.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={() => setDeleteUserConfirm({ ...deleteUserConfirm, open: false })}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                            ) : (
                                "Confirm Delete"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
