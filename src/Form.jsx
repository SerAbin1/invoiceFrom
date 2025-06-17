import { useState } from "react";
import axios from "axios";
import "./Form.css";

const materialsFromBackend = [
  "Cement", "Bricks", "Sand", "Steel", "Paint"
];

const Form = () => {
  const [formData, setFormData] = useState({
    customerName: "",
    place: "",
    date: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
    materials: [
      { description: "", hsn: "", qty: "", unitPrice: "", amount: "" }
    ],
    terms: [""],
    quoteIntro: "We are pleased to quote our best prices for the following items"
  });

  const [submittedData, setSubmittedData] = useState(null);
  const [submissionResponse, setSubmissionResponse] = useState(null);

  const updateMaterial = (index, field, value) => {
    const materials = [...formData.materials];

    if (["qty", "unitPrice"].includes(field)) {
      const numericValue = parseFloat(value);
      if (numericValue < 0) return;
    }

    materials[index][field] = value;
    const qty = parseFloat(materials[index].qty) || 0;
    const unitPrice = parseFloat(materials[index].unitPrice) || 0;
    materials[index].amount = qty * unitPrice;
    setFormData({ ...formData, materials });
  };

  const removeMaterial = (index) => {
    const materials = [...formData.materials];
    materials.splice(index, 1);
    setFormData({ ...formData, materials });
  };

  const addMaterial = () => {
    setFormData({
      ...formData,
      materials: [...formData.materials, { description: "", hsn: "", qty: "", unitPrice: "", amount: "" }]
    });
  };

  const addTerm = () => {
    setFormData({ ...formData, terms: [...formData.terms, ""] });
  };

  const removeTerm = (index) => {
    const terms = [...formData.terms];
    terms.splice(index, 1);
    setFormData({ ...formData, terms });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const requiredFields = [
      { name: "Customer Name", value: formData.customerName },
      { name: "Place", value: formData.place },
    ];

    for (let i = 0; i < formData.materials.length; i++) {
      const mat = formData.materials[i];
      if (!mat.description.trim()) return alert(`Material ${i + 1}: Description is required.`);
      if (!mat.hsn.trim()) return alert(`Material ${i + 1}: HSN is required.`);
      if (!mat.qty.toString().trim()) return alert(`Material ${i + 1}: Quantity is required.`);
      if (!mat.unitPrice.toString().trim()) return alert(`Material ${i + 1}: Unit Price is required.`);
    }

    for (const field of requiredFields) {
      if (!field.value.trim()) {
        alert(`${field.name} is required.`);
        return;
      }
    }

    setSubmittedData(formData);
  };

  const toWords = (n) => {
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const numberToWords = (num) => {
      if (num < 20) return a[num];
      if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");
      if (num < 1000) return a[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " and " + numberToWords(num % 100) : "");
      if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + numberToWords(num % 1000) : "");
      if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + numberToWords(num % 100000) : "");
      return numberToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + numberToWords(num % 10000000) : "");
    };

    return numberToWords(n);
  };

  const sendInvoice = async () => {
    if (!submittedData) return;

    const items = submittedData.materials.map((mat) => ({
      name: mat.description,
      hsn: mat.hsn,
      qty: Number(mat.qty),
      unitPrice: Number(mat.unitPrice),
      amount: Number(mat.amount),
    }));

    const untaxedAmount = items.reduce((acc, item) => acc + item.amount, 0);
    const sgst = untaxedAmount * 0.09;
    const cgst = untaxedAmount * 0.09;
    const total = untaxedAmount + sgst + cgst;

    const now = new Date();
    const quotationNo = "ITA" +
      String(now.getDate()).padStart(2, '0') +
      String(now.getMonth() + 1).padStart(2, '0') +
      now.getFullYear() +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0');

    const payload = {
      date: submittedData.date,
      quotationNo,
      recipientName: submittedData.customerName,
      recipientAddress: submittedData.place,
      items,
      untaxedAmount,
      sgst,
      cgst,
      total,
      totalInWords: toWords(Math.round(total)) + " Rupees only",
      terms: submittedData.terms,
    };

    try {
      const res = await axios.post("http://localhost:3001/geninvoice", payload);
      setSubmissionResponse(res.data);
      alert("Invoice sent successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to send invoice");
    }
  };

  const goBackToEdit = () => {
    setSubmittedData(null);
  };

  return submittedData ? (
    <div className="confirmation">
      <h2>Quotation Preview</h2>
      <p><strong>Customer:</strong> {submittedData.customerName}</p>
      <p><strong>Location:</strong> {submittedData.place}</p>
      <p><strong>Date:</strong> {submittedData.date}</p>

      <h3>Materials</h3>
      <table>
        <thead>
          <tr><th>S.No</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {submittedData.materials.map((mat, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{mat.description}</td>
              <td>{mat.qty}</td>
              <td>₹{mat.unitPrice}</td>
              <td>₹{Number(mat.amount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Terms</h4>
      <ul>
        {submittedData.terms.map((term, idx) => <li key={idx}>{term}</li>)}
      </ul>

      <button className="submit-button" onClick={sendInvoice}>Generate Quotation</button>
      <button className="edit-button" onClick={goBackToEdit}>Edit Details</button>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="invoice-form">
      <input placeholder="Customer Name" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
      <input placeholder="Place" value={formData.place} onChange={e => setFormData({ ...formData, place: e.target.value })} />
      <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
      <input value={formData.quoteIntro} onChange={e => setFormData({ ...formData, quoteIntro: e.target.value })} />
      <h3>Materials</h3>
      {formData.materials.map((mat, i) => (
        <div key={i} className="material-row">
          <div>{i + 1}</div>
          <input list="materials" value={mat.description} onChange={e => updateMaterial(i, 'description', e.target.value)} />
          <datalist id="materials">
            {materialsFromBackend.map((m, idx) => <option key={idx} value={m} />)}
          </datalist>
          <input placeholder="HSN" value={mat.hsn} onChange={e => updateMaterial(i, 'hsn', e.target.value)} />
          <input type="number" placeholder="Qty" value={mat.qty} onChange={e => updateMaterial(i, 'qty', e.target.value)} />
          <input type="number" placeholder="Unit Price" value={mat.unitPrice} onChange={e => updateMaterial(i, 'unitPrice', e.target.value)} />
          <button type="button" onClick={() => removeMaterial(i)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={addMaterial}>Add Material</button>
      <h3>Terms & Conditions</h3>
      {formData.terms.map((term, i) => (
        <div key={i} className="term-row">
          <input value={term} onChange={e => {
            const terms = [...formData.terms];
            terms[i] = e.target.value;
            setFormData({ ...formData, terms });
          }} />
          <button type="button" onClick={() => removeTerm(i)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={addTerm}>Add Term</button>
      <button type="submit">Submit</button>
    </form>
  );
};

export default Form;
