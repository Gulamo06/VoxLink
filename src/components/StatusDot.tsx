interface StatusDotProps {
  status: 'online' | 'busy' | 'offline';
}

const statusMap = {
  online: 'bg-white',
  busy: 'bg-text-secondary',
  offline: 'bg-border'
};

export default function StatusDot({ status }: StatusDotProps) {
  return <span className={`inline-block h-3.5 w-3.5 rounded-full ${statusMap[status]}`} />;
}
