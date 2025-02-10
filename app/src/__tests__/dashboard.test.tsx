import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Dashboard from '@/app/dashboard/page';


// UNIT TESTS
describe('Dashboard component', () => {

  it('renders the dashboard title', () => {
    render(<Dashboard />); // ARRANGE
    
    const titleElement = screen.getByText(/Pannello di Controllo/i); // ACT
    expect(titleElement).toBeInTheDocument();
  });

  /*
  it('renders the statistics cards', () => {
    render(<Dashboard />); // ARRANGE
    
    const requestStatsCard = screen.getByText(/Statistiche sulle Richieste/i); // ACT
    const keywordStatsCard = screen.getByText(/Statistiche sulle Parole Chiave/i); // ACT
    const dailyTrendCard = screen.getByText(/Andamento Giornaliero/i); // ACT
    const feedbackStatsCard = screen.getByText(/Statistiche sul Feedback/i); // ACT
    
    expect(requestStatsCard).toBeInTheDocument(); // ASSERT
    expect(keywordStatsCard).toBeInTheDocument(); // ASSERT
    expect(dailyTrendCard).toBeInTheDocument(); // ASSERT
    expect(feedbackStatsCard).toBeInTheDocument(); // ASSERT
  });

  it('renders the feedback statistics elements', () => {
    render(<Dashboard />); // ARRANGE
    
    const positiveFeedback = screen.getByText(/Feedback Positivo:/i); // ACT
    const negativeFeedback = screen.getByText(/Feedback Negativo:/i); // ACT
    
    expect(positiveFeedback).toBeInTheDocument(); // ASSERT
    expect(negativeFeedback).toBeInTheDocument(); // ASSERT
  });
  */
});