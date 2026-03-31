import Sidebar from './Sidebar'


export default function DarkLayout({ children }) {
return (
<div className="min-h-screen flex bg-gray-100">
<Sidebar />
<main className="flex-1 p-8">
<div className="max-w-4xl mx-auto">{children}</div>
</main>
</div>
)
}