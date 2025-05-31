import styled, { keyframes } from "styled-components";

const speaking = keyframes`
  0%   {   transform: scale(0.7); }
  20%  {  transform: scale(0.8); }
  40%  {  transform: scale(0.9); }
  60%  {  transform: scale(1); }
  80%  {  transform: scale(0.9); }
  100% {  transform: scale(0.8); }
`;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

const OuterOrb = styled.div`
  width: 338px;
  height: 338px;
  background: radial-gradient(
    circle,
    rgb(75 169 227),
    rgb(53 144 219 / 80%),
    rgb(18 0 255 / 50%),
    rgba(0, 0, 0, 0)
  );
  border-radius: 50%;
  position: relative;
  box-shadow: 0 0 50px rgba(0, 140, 255, 0.9), 0 0 100px rgba(0, 81, 255, 0.8),
    0 0 150px rgba(66, 0, 255, 0.6);

  @media (max-width: 1500px) {
    width: 10rem;
    height: 10rem;
  }
`;

const InnerOrb = styled.div`
  width: 240px;
  height: 240px;
  background-color: rgba(57, 94, 218, 0.53);
  border-radius: 50%;
  position: absolute;
  animation: ${speaking} 1s infinite ease-in-out;
  top: 14%;
  left: 14%;
  transform: translate(-50%, -50%);
  filter: blur(20px); /* Adds a blur effect */

  @media (max-width: 1500px) {
    width: 10rem;
    height: 10rem;

    top: 0%;
    left: 0%;
  }
`;

export const SpeakingOrb = () => {
  return (
    <Container>
      <OuterOrb>
        <InnerOrb />
      </OuterOrb>
    </Container>
  );
};
