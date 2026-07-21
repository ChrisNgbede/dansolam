<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ecommerce;
use App\Models\Expense;
use App\Models\InventoryLog;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BusinessOperationsController extends Controller
{
    private function ecommerceId(): int
    {
        return (int) Ecommerce::query()->value('id');
    }

    public function expenses(Request $request)
    {
        $query = Expense::with('user:id,name')->where('ecommerce_id', $this->ecommerceId());
        if ($request->filled('search')) $query->where(fn($q) => $q->where('description','like','%'.$request->search.'%')->orWhere('vendor','like','%'.$request->search.'%')->orWhere('expense_number','like','%'.$request->search.'%'));
        if ($request->filled('category')) $query->where('category', $request->category);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('from')) $query->whereDate('expense_date', '>=', $request->from);
        if ($request->filled('to')) $query->whereDate('expense_date', '<=', $request->to);
        $all = (clone $query)->get();
        return response()->json(['success'=>true,'data'=>$query->latest('expense_date')->latest('id')->paginate(30),'summary'=>[
            'total'=>(float)$all->where('status','paid')->sum('amount'),
            'pending'=>(float)$all->where('status','pending')->sum('amount'),
            'count'=>$all->count(),
            'categories'=>$all->where('status','paid')->groupBy('category')->map->sum('amount'),
        ]]);
    }

    public function storeExpense(Request $request)
    {
        $data = $request->validate([
            'expense_date'=>'required|date','category'=>'required|string|max:100','vendor'=>'nullable|string|max:255',
            'description'=>'required|string|max:255','amount'=>'required|numeric|min:0.01','payment_method'=>'required|in:cash,card,transfer,cheque,other',
            'status'=>'required|in:pending,paid,void','reference'=>'nullable|string|max:255','receipt_url'=>'nullable|string|max:2048','notes'=>'nullable|string|max:5000'
        ]);
        $expense = Expense::create($data + ['ecommerce_id'=>$this->ecommerceId(),'user_id'=>$request->user()?->id,'expense_number'=>'EXP-'.now()->format('ymd').'-'.strtoupper(substr(uniqid(),-6))]);
        return response()->json(['success'=>true,'message'=>'Expense recorded.','data'=>$expense], 201);
    }

    public function storeExpenseBatch(Request $request)
    {
        $data = $request->validate([
            'expenses'=>'required|array|min:1|max:100','expenses.*.expense_date'=>'required|date','expenses.*.category'=>'required|string|max:100',
            'expenses.*.vendor'=>'nullable|string|max:255','expenses.*.description'=>'required|string|max:255','expenses.*.amount'=>'required|numeric|min:0.01',
            'expenses.*.payment_method'=>'required|in:cash,card,transfer,cheque,other','expenses.*.status'=>'required|in:pending,paid,void',
            'expenses.*.reference'=>'nullable|string|max:255','expenses.*.receipt_url'=>'nullable|string|max:2048','expenses.*.notes'=>'nullable|string|max:5000'
        ]);
        $created = DB::transaction(function () use ($data, $request) {
            return collect($data['expenses'])->map(fn($row) => Expense::create($row + [
                'ecommerce_id'=>$this->ecommerceId(),'user_id'=>$request->user()?->id,
                'expense_number'=>'EXP-'.now()->format('ymd').'-'.strtoupper(substr(uniqid('', true),-6)),
            ]));
        });
        return response()->json(['success'=>true,'message'=>$created->count().' expenses recorded.','data'=>$created], 201);
    }

    public function bulkExpenseAction(Request $request)
    {
        $data=$request->validate(['ids'=>'required|array|min:1|max:500','ids.*'=>'integer','action'=>'required|in:mark_paid,mark_pending,mark_void,delete']);
        $query=Expense::where('ecommerce_id',$this->ecommerceId())->whereIn('id',$data['ids']);
        abort_if((clone $query)->count()!==count(array_unique($data['ids'])),404,'One or more expenses were not found.');
        $count=DB::transaction(function() use($query,$data){
            if($data['action']==='delete') return $query->delete();
            return $query->update(['status'=>str_replace('mark_','',$data['action'])]);
        });
        return response()->json(['success'=>true,'message'=>$count.' expenses updated.']);
    }

    public function updateExpense(Request $request, Expense $expense)
    {
        abort_unless($expense->ecommerce_id === $this->ecommerceId(), 404);
        $data = $request->validate([
            'expense_date'=>'required|date','category'=>'required|string|max:100','vendor'=>'nullable|string|max:255',
            'description'=>'required|string|max:255','amount'=>'required|numeric|min:0.01','payment_method'=>'required|in:cash,card,transfer,cheque,other',
            'status'=>'required|in:pending,paid,void','reference'=>'nullable|string|max:255','receipt_url'=>'nullable|string|max:2048','notes'=>'nullable|string|max:5000'
        ]);
        $expense->update($data);
        return response()->json(['success'=>true,'message'=>'Expense updated.','data'=>$expense]);
    }

    public function deleteExpense(Expense $expense)
    {
        abort_unless($expense->ecommerce_id === $this->ecommerceId(), 404);
        $expense->delete();
        return response()->json(['success'=>true,'message'=>'Expense deleted.']);
    }

    public function suppliers()
    {
        return response()->json(['success'=>true,'data'=>Supplier::where('ecommerce_id',$this->ecommerceId())->withCount('purchases')->orderBy('name')->get()]);
    }

    public function storeSupplier(Request $request)
    {
        $data = $request->validate(['name'=>'required|string|max:255','contact_person'=>'nullable|string|max:255','email'=>'nullable|email','phone'=>'nullable|string|max:50','address'=>'nullable|string','tax_number'=>'nullable|string|max:100','notes'=>'nullable|string','is_active'=>'boolean']);
        $supplier = Supplier::create($data + ['ecommerce_id'=>$this->ecommerceId()]);
        return response()->json(['success'=>true,'message'=>'Supplier saved.','data'=>$supplier], 201);
    }

    public function purchases(Request $request)
    {
        $query = Purchase::with(['supplier:id,name','user:id,name','items'])->where('ecommerce_id',$this->ecommerceId());
        if ($request->filled('search')) $query->where(fn($q)=>$q->where('purchase_number','like','%'.$request->search.'%')->orWhere('supplier_name','like','%'.$request->search.'%'));
        if ($request->filled('status')) $query->where('status',$request->status);
        $all=(clone $query)->get();
        return response()->json(['success'=>true,'data'=>$query->latest('purchase_date')->latest('id')->paginate(30),'summary'=>[
            'total'=>(float)$all->whereNotIn('status',['cancelled'])->sum('total_amount'),'received'=>(float)$all->where('status','received')->sum('total_amount'),
            'outstanding'=>(float)$all->whereNotIn('payment_status',['paid'])->whereNotIn('status',['cancelled'])->sum('total_amount'),'count'=>$all->count()
        ]]);
    }

    public function catalog()
    {
        return response()->json(['success'=>true,'data'=>Product::where('ecommerce_id',$this->ecommerceId())->with('variants:id,product_id,sku,size,color,stock_quantity,price')->select('id','name','sku','cost_price','stock_quantity','has_variants')->orderBy('name')->get()]);
    }

    public function storePurchase(Request $request)
    {
        $data=$request->validate([
            'supplier_id'=>'nullable|exists:suppliers,id','supplier_name'=>'required_without:supplier_id|string|max:255','purchase_date'=>'required|date','expected_date'=>'nullable|date',
            'status'=>'required|in:draft,ordered','payment_status'=>'required|in:unpaid,partial,paid','payment_method'=>'nullable|in:cash,card,transfer,cheque,credit,other',
            'reference'=>'nullable|string|max:255','tax_amount'=>'nullable|numeric|min:0','shipping_amount'=>'nullable|numeric|min:0','discount_amount'=>'nullable|numeric|min:0','notes'=>'nullable|string',
            'items'=>'required|array|min:1','items.*.product_id'=>'required|exists:products,id','items.*.product_variant_id'=>'nullable|exists:product_variants,id','items.*.quantity'=>'required|integer|min:1','items.*.unit_cost'=>'required|numeric|min:0'
        ]);
        $purchase=DB::transaction(function() use($data,$request){
            $supplier=!empty($data['supplier_id'])?Supplier::where('ecommerce_id',$this->ecommerceId())->findOrFail($data['supplier_id']):null;
            $subtotal=collect($data['items'])->sum(fn($i)=>$i['quantity']*$i['unit_cost']);
            $purchase=Purchase::create([
                'ecommerce_id'=>$this->ecommerceId(),'supplier_id'=>$supplier?->id,'user_id'=>$request->user()?->id,
                'purchase_number'=>'PUR-'.now()->format('ymd').'-'.strtoupper(substr(uniqid(),-6)),'supplier_name'=>$supplier?->name ?? $data['supplier_name'],
                'purchase_date'=>$data['purchase_date'],'expected_date'=>$data['expected_date']??null,'status'=>$data['status'],'payment_status'=>$data['payment_status'],
                'payment_method'=>$data['payment_method']??null,'reference'=>$data['reference']??null,'subtotal'=>$subtotal,'tax_amount'=>$data['tax_amount']??0,
                'shipping_amount'=>$data['shipping_amount']??0,'discount_amount'=>$data['discount_amount']??0,
                'total_amount'=>$subtotal+($data['tax_amount']??0)+($data['shipping_amount']??0)-($data['discount_amount']??0),'notes'=>$data['notes']??null
            ]);
            foreach($data['items'] as $item){
                $product=Product::where('ecommerce_id',$this->ecommerceId())->findOrFail($item['product_id']); $variant=!empty($item['product_variant_id'])?ProductVariant::findOrFail($item['product_variant_id']):null;
                abort_if($variant && $variant->product_id!==$product->id,422,'Selected variant does not belong to product.');
                $purchase->items()->create(['product_id'=>$product->id,'product_variant_id'=>$variant?->id,'product_name'=>$product->name,'sku'=>$variant?->sku ?: $product->sku,'quantity'=>$item['quantity'],'unit_cost'=>$item['unit_cost'],'line_total'=>$item['quantity']*$item['unit_cost']]);
            }
            return $purchase->load('items');
        });
        return response()->json(['success'=>true,'message'=>'Purchase order created.','data'=>$purchase],201);
    }

    public function updatePurchaseStatus(Request $request, Purchase $purchase)
    {
        abort_unless($purchase->ecommerce_id===$this->ecommerceId(),404);
        $data=$request->validate(['status'=>['required',Rule::in(['draft','ordered','cancelled'])],'payment_status'=>['sometimes',Rule::in(['unpaid','partial','paid'])]]);
        abort_if($purchase->status==='received',422,'Received purchases cannot be changed.');
        $purchase->update($data);
        return response()->json(['success'=>true,'message'=>'Purchase updated.','data'=>$purchase]);
    }

    public function receivePurchase(Request $request, Purchase $purchase)
    {
        abort_unless($purchase->ecommerce_id===$this->ecommerceId(),404);
        abort_if(in_array($purchase->status,['received','cancelled']),422,'This purchase cannot be received.');
        DB::transaction(function() use($purchase,$request){
            $purchase->load('items');
            foreach($purchase->items as $item){
                $stock=$item->product_variant_id?ProductVariant::lockForUpdate()->findOrFail($item->product_variant_id):Product::lockForUpdate()->findOrFail($item->product_id);
                $old=(int)$stock->stock_quantity; $stock->stock_quantity=$old+$item->quantity; $stock->save();
                if(!$item->product_variant_id) Product::whereKey($item->product_id)->update(['cost_price'=>$item->unit_cost]);
                InventoryLog::create(['product_variant_id'=>$item->product_variant_id,'product_id'=>$item->product_id,'old_quantity'=>$old,'new_quantity'=>$old+$item->quantity,'change_amount'=>$item->quantity,'reason'=>'purchase_received:'.$purchase->purchase_number,'user_id'=>$request->user()?->id]);
            }
            $purchase->update(['status'=>'received','received_at'=>now()]);
        });
        return response()->json(['success'=>true,'message'=>'Purchase received and inventory updated.','data'=>$purchase->fresh('items')]);
    }

    public function bulkPurchaseAction(Request $request)
    {
        $data=$request->validate(['ids'=>'required|array|min:1|max:200','ids.*'=>'integer','action'=>'required|in:mark_ordered,receive,cancel,delete']);
        $purchases=Purchase::where('ecommerce_id',$this->ecommerceId())->whereIn('id',$data['ids'])->with('items')->get();
        abort_if($purchases->count()!==count(array_unique($data['ids'])),404,'One or more purchases were not found.');
        DB::transaction(function() use($purchases,$data,$request){
            foreach($purchases as $purchase){
                if($data['action']==='delete') { abort_if($purchase->status==='received',422,'Received purchases cannot be deleted.'); $purchase->delete(); continue; }
                if($data['action']==='cancel') { abort_if($purchase->status==='received',422,'Received purchases cannot be cancelled.'); $purchase->update(['status'=>'cancelled']); continue; }
                if($data['action']==='mark_ordered') { abort_unless($purchase->status==='draft',422,'Only draft purchases can be ordered.'); $purchase->update(['status'=>'ordered']); continue; }
                abort_unless(in_array($purchase->status,['draft','ordered']),422,'Only open purchases can be received.');
                foreach($purchase->items as $item){
                    $stock=$item->product_variant_id?ProductVariant::lockForUpdate()->findOrFail($item->product_variant_id):Product::lockForUpdate()->findOrFail($item->product_id);
                    $old=(int)$stock->stock_quantity; $stock->update(['stock_quantity'=>$old+$item->quantity]);
                    if(!$item->product_variant_id) Product::whereKey($item->product_id)->update(['cost_price'=>$item->unit_cost]);
                    InventoryLog::create(['product_variant_id'=>$item->product_variant_id,'product_id'=>$item->product_id,'old_quantity'=>$old,'new_quantity'=>$old+$item->quantity,'change_amount'=>$item->quantity,'reason'=>'purchase_received:'.$purchase->purchase_number,'user_id'=>$request->user()?->id]);
                }
                $purchase->update(['status'=>'received','received_at'=>now()]);
            }
        });
        return response()->json(['success'=>true,'message'=>$purchases->count().' purchases processed.']);
    }

    public function deletePurchase(Purchase $purchase)
    {
        abort_unless($purchase->ecommerce_id===$this->ecommerceId(),404);
        abort_if($purchase->status==='received',422,'Received purchases cannot be deleted.');
        $purchase->delete();
        return response()->json(['success'=>true,'message'=>'Purchase deleted.']);
    }
}
