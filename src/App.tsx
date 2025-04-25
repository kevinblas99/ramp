import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [hasLoadedEmployees, setHasLoadedEmployees] = useState(false)


  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoadingTransactions(true)
    transactionsByEmployeeUtils.invalidateData()
  
    if (employees === null) {
      await employeeUtils.fetchAll()
    }

    setHasLoadedEmployees(true)
  
    await paginatedTransactionsUtils.fetchAll()
    setIsLoadingTransactions(false)
  }, [employees, employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

useEffect(() => {
  if (employees === null && !employeeUtils.loading) {
    loadAllTransactions()
  } else if (employees !== null) {
    setHasLoadedEmployees(true)
  }
}, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={!hasLoadedEmployees}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }
            if (newValue.id === EMPTY_EMPLOYEE.id) {
              await loadAllTransactions()
            } else {
            await loadTransactionsByEmployee(newValue.id)}
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />
          {/* conditionally rendering only if there is more data otherwise view button goes away */}
          {transactionsByEmployee === null && transactions !== null && paginatedTransactions?.nextPage !== null && (
          <button
            className="RampButton"
            disabled={paginatedTransactionsUtils.loading || isLoadingTransactions}
            onClick={async () => {
              await paginatedTransactionsUtils.fetchAll()
            }}
          >
            View More
          </button>
        )}
        </div>
      </main>
    </Fragment>
  )
}
