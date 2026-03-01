import Svg, { Path, type SvgProps } from "react-native-svg";

export const GreenCheck = (props: SvgProps) => (
  <Svg viewBox="0 0 30 31" width={30} height={31} fill="none" {...props}>
    <Path
      fill={props.fill ?? "#28B770"}
      fillRule="evenodd"
      d="m19.866 13.152-5.772 5.773a.933.933 0 0 1-1.326 0L9.88 16.039a.938.938 0 0 1 1.325-1.327l2.225 2.224 5.109-5.11a.938.938 0 1 1 1.326 1.326Zm.28-9.652H9.602C5.654 3.5 3 6.276 3 10.409v9.935c0 4.131 2.654 6.906 6.602 6.906h10.543c3.95 0 6.605-2.775 6.605-6.906v-9.935c0-4.133-2.654-6.909-6.604-6.909Z"
      clipRule="evenodd"
    />
    <Path
      fill="#fff"
      d="m19.866 13.152-5.772 5.773a.933.933 0 0 1-1.326 0L9.88 16.039a.938.938 0 0 1 1.325-1.327l2.225 2.224 5.109-5.11a.938.938 0 1 1 1.326 1.326Z"
    />
  </Svg>
);
