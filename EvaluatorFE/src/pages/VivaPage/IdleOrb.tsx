//idle
import styled from "styled-components";

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
    0 0 150px rgba(66, 0, 255, 0.3);
  @media (max-width: 1500px) {
    width: 10rem;
    height: 10rem;
  }
`;

const InnerOrb = styled.div`
  width: 200px;
  height: 200px;
  background-color: #2346bb88;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  filter: blur(20px); /* Adds a blur effect */
`;

const IdleOrb = () => {
  return (
    <Container>
      <OuterOrb>
        <InnerOrb />
      </OuterOrb>
    </Container>
  );
};

export default IdleOrb;
