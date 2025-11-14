import { Link } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { useEscalations } from '../../hooks/useEscalations';
import { AlertCircle } from 'lucide-react';

export function EscalationBadge() {
  const { data: escalations } = useEscalations('pending');

  const pendingCount = escalations?.length || 0;

  if (pendingCount === 0) {
    return null;
  }

  return (
    <Link
      to="/escalations"
      className="relative flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
    >
      <AlertCircle className="w-5 h-5 text-orange-500" />
      <span className="text-sm font-medium">Escalations</span>
      <Badge className="bg-orange-500 text-white hover:bg-orange-600">
        {pendingCount}
      </Badge>
    </Link>
  );
}
