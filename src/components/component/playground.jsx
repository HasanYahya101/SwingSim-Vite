import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GRAVITY = 9.81;
const DAMPING = 0.999;
const PATH_LENGTH = 100;

const PendulumSimulation = ({ numJoints, initialAngle }) => {
    const canvasRef = useRef(null);
    const [pendulum, setPendulum] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pendulumSystem = new PendulumSystem(numJoints, initialAngle);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawFixedPoint(ctx, canvas.width / 2, 50);
            pendulumSystem.update();
            pendulumSystem.draw(ctx, canvas.width / 2, 50);
            requestAnimationFrame(animate);
        };

        animate();
        setPendulum(pendulumSystem);
    }, [numJoints, initialAngle]);

    return (
        <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="border rounded-lg w-full mx-auto"
        />
    );
};

const drawFixedPoint = (ctx, x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#4A5568';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#E2E8F0';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#4A5568';
    ctx.fill();
};

class PendulumSystem {
    constructor(numJoints, initialAngle) {
        this.joints = Array(numJoints).fill().map(() => ({
            angle: initialAngle,
            angularVelocity: 0,
            length: 40,
            mass: 1,
            path: []
        }));
    }

    update() {
        const dt = 0.1;
        for (let i = 0; i < this.joints.length; i++) {
            let torque = 0;
            for (let j = i; j < this.joints.length; j++) {
                const angle = this.joints.slice(i, j + 1).reduce((sum, joint) => sum + joint.angle, 0);
                torque -= this.joints[j].mass * GRAVITY * this.joints[i].length * Math.sin(angle);
            }

            const inertia = this.joints.slice(i).reduce((sum, joint) => sum + joint.mass * joint.length ** 2, 0);
            const angularAcceleration = torque / inertia;

            this.joints[i].angularVelocity += angularAcceleration * dt;
            this.joints[i].angularVelocity *= DAMPING;
            this.joints[i].angle += this.joints[i].angularVelocity * dt;
        }

        // Update paths
        let x = 0;
        let y = 0;
        this.joints.forEach((joint, index) => {
            x += joint.length * Math.sin(joint.angle);
            y += joint.length * Math.cos(joint.angle);
            joint.path.push({ x, y });
            if (joint.path.length > PATH_LENGTH) {
                joint.path.shift();
            }
        });
    }

    draw(ctx, startX, startY) {
        let x = startX;
        let y = startY;

        // Draw threads
        ctx.beginPath();
        ctx.moveTo(x, y);
        this.joints.forEach((joint) => {
            const endX = x + joint.length * Math.sin(joint.angle);
            const endY = y + joint.length * Math.cos(joint.angle);
            ctx.lineTo(endX, endY);
            x = endX;
            y = endY;
        });
        ctx.strokeStyle = '#A0AEC0';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Reset position for drawing joints and paths
        x = startX;
        y = startY;

        // Draw paths and joints
        this.joints.forEach((joint, index) => {
            const endX = x + joint.length * Math.sin(joint.angle);
            const endY = y + joint.length * Math.cos(joint.angle);

            // Draw path
            ctx.beginPath();
            joint.path.forEach((point, i) => {
                const alpha = i / PATH_LENGTH;
                ctx.strokeStyle = `rgba(66, 153, 225, ${alpha})`;
                ctx.lineWidth = 2;
                if (i === 0) {
                    ctx.moveTo(startX + point.x, startY + point.y);
                } else {
                    ctx.lineTo(startX + point.x, startY + point.y);
                }
            });
            ctx.stroke();

            // Draw joint
            ctx.beginPath();
            ctx.arc(endX, endY, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#4A5568';
            ctx.fill();

            x = endX;
            y = endY;
        });
    }
}

const ChaosPendulumApp = () => {
    const [numJoints, setNumJoints] = useState(3);
    const [initialAngle, setInitialAngle] = useState(Math.PI / 4);
    const [isSimulating, setIsSimulating] = useState(false);

    const handleStartSimulation = () => {
        setIsSimulating(true);
    };

    return (
        <div className="p-6 max-w-2xl mx-auto min-h-screen bg-white">
            <Card className='bg-gray-50 shadow-lg'>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold w-full">Chaos Pendulum Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                    {!isSimulating ? (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="numJoints">Number of Joints: {numJoints}</Label>
                                <Slider
                                    id="numJoints"
                                    min={2}
                                    max={10}
                                    step={1}
                                    value={[numJoints]}
                                    onValueChange={(value) => setNumJoints(value[0])}
                                    className="my-2"
                                />
                            </div>
                            <div>
                                <Label htmlFor="initialAngle">Initial Angle: {(initialAngle * 180 / Math.PI).toFixed(0)}°</Label>
                                <Slider
                                    id="initialAngle"
                                    min={0}
                                    max={Math.PI / 2}
                                    step={0.01}
                                    value={[initialAngle]}
                                    onValueChange={(value) => setInitialAngle(value[0])}
                                    className="my-2"
                                />
                            </div>
                            <Button onClick={handleStartSimulation} className="w-full">Start Simulation</Button>
                        </div>
                    ) : (
                        <PendulumSimulation numJoints={numJoints} initialAngle={initialAngle} />
                    )}
                    <p className="mt-4 text-sm text-gray-600 w-full">
                        This visualization demonstrates how chaos increases in a pendulum system as you add more joints.
                        The motion becomes increasingly unpredictable and complex with each additional joint.
                        Observe the fading paths to see the chaotic trajectories of each joint.
                        The larger circle at the top represents the fixed point where the pendulum is attached.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ChaosPendulumApp;