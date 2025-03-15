import SentimentAnalysis from "../components/SentimentAnalysis";
import ReportGenerator from "../components/ReportGenerator";
import ProductSelection from "../components/ProductSelection";
import "./styles.css"; 

const MainPage = () => {
  return (
    <div className="main-container">
      <SentimentAnalysis />
      <ReportGenerator />
      <ProductSelection />
    </div>
  );
};

export default MainPage;