'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface Ticket {
  id: string
  created_at: string
  type: string
  subject: string
  message: string
  priority: string
  status: string
  email?: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTickets = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tickets:', error)
      } else {
        setTickets(data || [])
      }
      setLoading(false)
    }

    fetchTickets()

    // Realtime subscription could be added here
    const supabase = createClient()
    const channel = supabase
      .channel('tickets_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
          setTickets((prev) => [payload.new as Ticket, ...prev])
      })
      .subscribe()

    return () => {
        supabase.removeChannel(channel)
    }
  }, [])


  const getStatusColor = (status: string) => {
      switch(status) {
          case 'open': return 'bg-green-500/10 text-green-500 border-green-500/20'
          case 'closed': return 'bg-muted text-muted-foreground'
          case 'in-progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
          default: return 'bg-gray-500/10 text-gray-500'
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground mt-2">
            Manage and respond to user support requests.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>
            A list of all support tickets submitted by users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading tickets...
                  </TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No tickets found.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium truncate max-w-[200px]">{ticket.subject}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{ticket.message}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{ticket.type}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.priority === 'critical' ? 'destructive' : 'secondary'} className="capitalize">
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                       <button className="text-sm font-medium text-primary hover:underline">View</button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
