export enum SpecialTokenType {
  confirm_account = "confirm_account",
}
const SpecialToken = (type: SpecialTokenType) => {
  const baseToken = process.env.JWT_SECRET;
  return baseToken + type;
};

export default SpecialToken;
