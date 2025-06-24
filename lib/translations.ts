export const translateTransactionReason = (reason: string): string => {
  // Handle English patterns and convert to Turkish
  if (reason.includes("Points awarded for attending event:")) {
    const eventTitle = reason.replace("Points awarded for attending event:", "").trim();
    return `Etkinlik katılımı: ${eventTitle}`;
  }
  
  if (reason.includes("Redeemed for item:")) {
    const itemName = reason.replace("Redeemed for item:", "").trim();
    return `Ürün satın alındı: ${itemName}`;
  }
  
  if (reason.includes("Points awarded by") || reason.includes("Points decreased by")) {
    const userName = reason.split(" by ")[1];
    const isAwarded = reason.includes("awarded");
    return `${isAwarded ? 'Puan eklendi' : 'Puan azaltıldı'} - ${userName}`;
  }
  
  // Handle other common English patterns
  if (reason.includes("Points added") || reason.includes("Points removed")) {
    const isAdded = reason.includes("added");
    return isAdded ? 'Puan eklendi' : 'Puan azaltıldı';
  }
  
  // Return as-is if already in Turkish or no pattern matches
  return reason;
}; 