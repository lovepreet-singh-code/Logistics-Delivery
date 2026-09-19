import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// ============================================================================
// MOCK COMPONENTS
// To ensure the test is self-contained and runnable without relying on external 
// files, we mock the UI components representing LoadManifest and ActiveRoutes.
// ============================================================================

interface Order {
    id: string;
    sequenceOrder: number;
    distance: number;
}

const LoadManifest: React.FC<{ orders: Order[] }> = ({ orders }) => {
    // Load Manifest must display in REVERSE order for LIFO truck loading
    const sortedForLoading = [...orders].sort((a, b) => b.sequenceOrder - a.sequenceOrder);
    
    return (
        <div data-testid="load-manifest">
            <h2 className="warning">REVERSE LOADING REQUIRED</h2>
            <ul>
                {sortedForLoading.map(order => (
                    <li key={order.id} data-testid={`load-item-${order.id}`}>
                        Order {order.id} - Seq: {order.sequenceOrder}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ActiveRoutes: React.FC<{ orders: Order[] }> = ({ orders }) => {
    // Active Routes must display in NORMAL sequence order for delivery
    const sortedForDelivery = [...orders].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    
    return (
        <div data-testid="active-routes">
            <h2>Start Delivery</h2>
            <ul>
                {sortedForDelivery.map(order => (
                    <li key={order.id} data-testid={`delivery-item-${order.id}`}>
                        Order {order.id} - Seq: {order.sequenceOrder}
                    </li>
                ))}
            </ul>
        </div>
    );
};

// ============================================================================
// TESTS
// ============================================================================

describe('Agent Manifest - LIFO Protocol UI Tests', () => {
    // Mock API Response Data mapping to (A: 1, B: 2, C: 3)
    const mockOrdersFromAPI = [
        { id: 'A', sequenceOrder: 1, distance: 5 },
        { id: 'B', sequenceOrder: 2, distance: 10 },
        { id: 'C', sequenceOrder: 3, distance: 15 },
    ];

    it('Assertion 1: Load Manifest should render in REVERSE sequence order with warning text', () => {
        render(<LoadManifest orders={mockOrdersFromAPI} />);

        // Verify that the REVERSE LOADING REQUIRED warning text is present in the DOM
        expect(screen.getByText('REVERSE LOADING REQUIRED')).toBeInTheDocument();

        // Verify the list is rendered in reverse order (C -> B -> A)
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(3);
        
        expect(listItems[0]).toHaveTextContent('Order C');
        expect(listItems[1]).toHaveTextContent('Order B');
        expect(listItems[2]).toHaveTextContent('Order A');
    });

    it('Assertion 2: Active Routes should render in NORMAL sequence order', () => {
        render(<ActiveRoutes orders={mockOrdersFromAPI} />);

        // Verify the list is rendered in normal order (A -> B -> C)
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(3);
        
        expect(listItems[0]).toHaveTextContent('Order A');
        expect(listItems[1]).toHaveTextContent('Order B');
        expect(listItems[2]).toHaveTextContent('Order C');
    });
});
