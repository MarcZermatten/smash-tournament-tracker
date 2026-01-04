// Fonction utilitaire pour jouer le son de sélection du menu
export const playMenuSelectSound = () => {
  const selectSound = new Audio('/audio/melee-menu-select.mp3');
  selectSound.volume = 0.6;
  selectSound.play().catch(() => {});
};
