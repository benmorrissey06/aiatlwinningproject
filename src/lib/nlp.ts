export function detectCategory(text: string): string {
  const t = text.toLowerCase()
  if (/(textbook|book|study guide)/.test(t)) return 'Textbooks'
  if (/(medicine|ibuprofen|cold|sick|first aid)/.test(t)) return 'Medicine'
  if (/(blazer|shirt|jacket|outfit|clothes|clothing)/.test(t)) return 'Clothing'
  if (/(charger|laptop|adapter|iphone|usb|electronics)/.test(t)) return 'Electronics'
  if (/(pizza|meal|snack|food)/.test(t)) return 'Food'
  if (/(sofa|desk|lamp|furniture)/.test(t)) return 'Furniture'
  return 'Other'
}

