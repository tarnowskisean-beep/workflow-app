
import { TASK_STATUS } from "@/lib/constants"

export function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`text-[10px] px-2 py-1 rounded-full border ${status === TASK_STATUS.DONE ? 'bg-green-50 text-green-700 border-green-200' :
            status === TASK_STATUS.IN_PROGRESS ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
            {status.replace('_', ' ')}
        </span>
    )
}
