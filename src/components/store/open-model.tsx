"use client"
import { useStoreUi } from './store-ui-context';

export default function OpenModel() {
const { openModal } = useStoreUi();
  return (
    <button type="button"
        className=' hover:text-amber-700 text-amber-600 mt-2 !text-lg !font-semibold'
        onClick={() => {openModal('request'); }}>  اطلب توفير  هذا المنتج 
    </button>
  )
}
