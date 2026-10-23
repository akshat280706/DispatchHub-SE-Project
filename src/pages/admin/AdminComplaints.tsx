import ManagerComplaints from '../manager/ManagerComplaints'

// Same review screen as managers. Row Level Security gives administrators every complaint.
export default function AdminComplaints() {
  return <ManagerComplaints system />
}
