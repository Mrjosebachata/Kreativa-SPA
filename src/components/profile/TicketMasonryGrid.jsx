import TicketCard from './TicketCard';

export default function TicketMasonryGrid({
  commissions,
  updatingCommissionId,
  uploadingCommissionId,
  archivingCommissionId,
  hidingCommissionId,
  onStatusChange,
  onFilesChange,
  onArchive,
  onHideCompleted,
  onOpenChat,
  className = '',
}) {
  if (commissions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gold/40 bg-cream-100/60 px-4 py-7 text-center text-sm text-warm-500">
        No tienes comisiones activas.
      </div>
    );
  }

  return (
    <div className={`masonry-grid ${className}`} aria-label="Tickets activos">
      {commissions.map((commission) => (
        <div key={commission.id} className="masonry-item">
          <TicketCard
            commission={commission}
            isUpdating={updatingCommissionId === commission.id}
            isUploading={uploadingCommissionId === commission.id}
            isArchiving={archivingCommissionId === commission.id}
            isHiding={hidingCommissionId === commission.id}
            onStatusChange={onStatusChange}
            onFilesChange={onFilesChange}
            onArchive={onArchive}
            onHideCompleted={onHideCompleted}
            onOpenChat={onOpenChat}
          />
        </div>
      ))}
    </div>
  );
}
