import Svg, { Path, type SvgProps } from "react-native-svg";

export const InfoIcon = (props: SvgProps) => (
  <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" {...props}>
    <Path
      fill={props.fill ?? "#EDBE43"}
      fillRule="evenodd"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z"
      clipRule="evenodd"
    />
  </Svg>
);
