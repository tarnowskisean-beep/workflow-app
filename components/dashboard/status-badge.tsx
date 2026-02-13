
import { TASK_STATUS } from "@/lib/constants"

export function StatusBadge({ status }: { status: string }) {
    // Treat IN_PROGRESS as OPEN for display purposes
    const displayStatus = status === TASK_STATUS.IN_PROGRESS ? TASK_STATUS.OPEN : status

    return (
        <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${displayStatus === TASK_STATUS.DONE ? 'bg-green-50 text-green-700 border-green-200' :
            'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
            {displayStatus}
        </span>
    )
}
