import styled from "styled-components";

const backgroundImage = "/img/background.png";

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  background-image: url(${backgroundImage});
  background-repeat: no-repeat;
  background-size: cover;
`;
const Content = styled.div`
  position: absolute;
  top: 33vh;
  left: 126vh;
  width: 360px;
  height: 250px;
  overflow: auto;
`;

const Layout:  React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Container>
      <Content>{children}</Content>
    </Container>
  );
};

export default Layout;
