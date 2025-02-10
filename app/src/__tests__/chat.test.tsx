import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Chat from '@/app/page';

// UNIT TESTS
describe('Chat component', () => {

    it('renders chat component', () => {
        render(<Chat />); // ARRANGE

        const chatElement = screen.getByText(/Conversazioni Libere/i); // ACT
        expect(chatElement).toBeInTheDocument(); // ASSERT
    });
    /*
    it('renders navigation buttons', () => {
        render(<Chat />); // ARRANGE

        const freeConversationButton = screen.getByText(/Conversazione Libera/i); // ACT
        const guidedConversationButton = screen.getByText(/Conversazione Guidata/i); // ACT

        expect(freeConversationButton).toBeInTheDocument(); // ASSERT
        expect(guidedConversationButton).toBeInTheDocument(); // ASSERT
    });

    it('renders conversation list', () => {
        render(<Chat />); // ARRANGE

        const conversation1 = screen.getByText(/Libera 1/i); // ACT
        const conversation2 = screen.getByText(/Libera 2/i); // ACT
        const conversation3 = screen.getByText(/Guidata 1/i);// ACT

        expect(conversation1).toBeInTheDocument(); // ASSERT
        expect(conversation2).toBeInTheDocument(); // ASSERT
        expect(conversation3).toBeInTheDocument(); // ASSERT
    });

    it('renders admin section and reserved area button', () => {
        render(<Chat />); // ARRANGE

        const adminSection = screen.getByText(/Conversazioni Libere/i);
        const reservedAreaButton = screen.getByText(/Conversazione Guidata/i);

        expect(adminSection).toBeInTheDocument(); // ASSERT
        expect(reservedAreaButton).toBeInTheDocument(); // ASSERT
    });
    */

});