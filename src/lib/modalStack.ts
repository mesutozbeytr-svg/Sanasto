const openModals: symbol[] = [];
let savedBodyOverflow = '';

export function openModal(): symbol {
  const id = Symbol('modal');
  if (openModals.length === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  openModals.push(id);
  return id;
}

export function closeModal(id: symbol): void {
  const index = openModals.indexOf(id);
  if (index === -1) return;
  openModals.splice(index, 1);
  if (openModals.length === 0) {
    document.body.style.overflow = savedBodyOverflow;
  }
}

export function isTopModal(id: symbol): boolean {
  return openModals[openModals.length - 1] === id;
}
