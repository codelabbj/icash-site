/**
 * Cellule pour afficher les informations du destinataire dans un tableau
 * Gère le cas où recipient peut être null ou undefined
 */
export const recipientCell = (cell: { 
  row?: { original?: { recipient?: { first_name?: string; last_name?: string; email?: string } | null } }
  getValue?: () => { first_name?: string; last_name?: string; email?: string } | null | undefined
}) => {
  // Essayer d'obtenir recipient depuis row.original ou getValue()
  const recipient = cell.row?.original?.recipient || cell.getValue?.() || null
  
  if (!recipient) {
    return (
      <div>
        <div className="fw-semibold">N/A</div>
        <div className="small text-secondary">-</div>
      </div>
    )
  }

  return (
    <div>
      <div className="fw-semibold">
        {recipient.first_name || ''} {recipient.last_name || ''}
      </div>
      <div className="small text-secondary">{recipient.email || '-'}</div>
    </div>
  )
}

