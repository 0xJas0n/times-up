export const generateRoomCode = (): string => {
  const characters = '0123456789ABCDEF';
  let code = '';

  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  return code;
};
