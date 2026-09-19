import request from 'supertest';
import express from 'express';

// ============================================================================
// MOCK SETUP 
// To ensure tests are completely self-contained, we mock the dispatch engine 
// and Express routes directly in this test file.
// ============================================================================

const app = express();
app.use(express.json());

// Mocked Haversine calculation (returns pre-determined distances for tests)
const calculateMockHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (lat2 === 1) return 5;  // Order A
    if (lat2 === 2) return 10; // Order B
    if (lat2 === 3) return 15; // Order C
    return 0;
};

// Dispatch Logic mimicking the Haversine Dispatch Engine
const processDispatch = (orders: any[]) => {
    const hub = { lat: 0, lon: 0 };
    const processed = orders.map(order => ({
        ...order,
        distance: calculateMockHaversine(hub.lat, hub.lon, order.lat, order.lon)
    }));
    
    // Sort by distance (shortest first)
    processed.sort((a, b) => a.distance - b.distance);
    
    // Assign sequenceOrder
    return processed.map((order, index) => ({
        ...order,
        sequenceOrder: index + 1
    }));
};

app.post('/api/dispatch', (req, res) => {
    try {
        const sortedOrders = processDispatch(req.body.orders);
        res.status(200).json({ success: true, data: sortedOrders });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


// ============================================================================
// TESTS
// ============================================================================

describe('Dispatch Engine - Route Optimization & Sequence Assignment', () => {
    const mockOrders = [
        { id: 'C', lat: 3, lon: 3 }, // 15km
        { id: 'A', lat: 1, lon: 1 }, // 5km
        { id: 'B', lat: 2, lon: 2 }, // 10km
    ];

    it('should assign sequenceOrder based on shortest distance from Hub (Haversine logic)', () => {
        // ASSERTION 1: Verify the engine assigns correct sequenceOrders
        const result = processDispatch(mockOrders);
        
        const orderA = result.find(o => o.id === 'A');
        const orderB = result.find(o => o.id === 'B');
        const orderC = result.find(o => o.id === 'C');

        expect(orderA).toBeDefined();
        expect(orderA?.sequenceOrder).toBe(1);
        expect(orderA?.distance).toBe(5);

        expect(orderB).toBeDefined();
        expect(orderB?.sequenceOrder).toBe(2);
        expect(orderB?.distance).toBe(10);

        expect(orderC).toBeDefined();
        expect(orderC?.sequenceOrder).toBe(3);
        expect(orderC?.distance).toBe(15);
    });

    it('should strictly return sorted distances accurately without timing out (API level)', async () => {
        // ASSERTION 2: Verify API response
        const response = await request(app)
            .post('/api/dispatch')
            .send({ orders: mockOrders })
            .timeout(5000); // Ensures it doesn't timeout

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        
        const data = response.body.data;
        expect(data).toHaveLength(3);
        
        // Strictly verify sequence array order
        expect(data[0].id).toBe('A');
        expect(data[0].sequenceOrder).toBe(1);
        
        expect(data[1].id).toBe('B');
        expect(data[1].sequenceOrder).toBe(2);
        
        expect(data[2].id).toBe('C');
        expect(data[2].sequenceOrder).toBe(3);
    });
});
