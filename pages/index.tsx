import { useState } from "react";
import { useRouter } from "next/router";
import { useSocket } from "../components/provider/SocketProvider";
import Layout from "./Layout";

const backgroundImage = "/img/background.png";


const Home = () => {
  const [nickname, setNickname] = useState<string>("");
  const router = useRouter();
  const { socket } = useSocket();

  const handleJoin = () => {
    if (nickname && socket) {
      socket.emit("join", nickname);
      router.push("/rooms");
    }
  };

  return (
    <Layout>
        <h3>라이어 게임</h3>
        <input
          type="text"
          placeholder="닉네임 입력"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <button onClick={handleJoin}>참여</button>
    </Layout>
  );
};

export default Home;
