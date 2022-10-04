import { NextPage } from 'next';
import dynamic from 'next/dynamic';

const PhaserComponent = dynamic(() => import('../components/PhaserComponent'), { ssr: false });

const Index: NextPage = () => <PhaserComponent />;

export default Index;
