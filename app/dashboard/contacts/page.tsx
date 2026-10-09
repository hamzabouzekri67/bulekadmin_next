"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
  Loader2,
  PhoneCall,
  Globe,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  X,
  Save,
} from "lucide-react";
import { User, useUser } from "@/app/context/UserContext";
import { addApiContacts, fetchApiContacts } from "./api/handel_contact";

interface Region {
  ville: string;
}

interface CountryDetail {
  _id: string;
  country: string;
  regions: Region[];
}

interface Contact {
  _id?: string;
  name: string;
  phoneNumber: string;
  ville: string;
  country: string;
  type: "client" | "driver" | "support";
  category: "standard" | "branch";
}

export default function ServicePhonePage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [countryData, setCountryData] = useState<CountryDetail | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("Algeria");

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [wilaya, setWilaya] = useState<string>("");
  const [type, setType] = useState<"client" | "driver" | "support">("support");
  const [category, setCategory] = useState<"standard" | "branch">("standard");
  const { user } = useUser();

  const fetchData = async (countryName: string, user: User | null) => {
    try {
      setLoading(true);
      const res = await fetchApiContacts(user);
      console.log(res);

      if (res.status && res.result) {
        setCountryData(res.result.country);
        setContacts(res.result.contect || []);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("user", user);

    if (!user) return;
    fetchData(selectedCountry, user);
  }, [user]);

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingId(contact._id ?? null);
      setName(contact.name);
      setPhoneNumber(contact.phoneNumber);
      setWilaya(contact.ville || (countryData?.regions?.[0]?.ville ?? ""));
      setType(contact.type);
      setCategory(contact.category);
    } else {
      setEditingId(null);
      setName("");
      setPhoneNumber("");
      setWilaya(countryData?.regions?.[0]?.ville ?? "");
      setType("support");
      setCategory("standard");
    }
    setIsModalOpen(true);
  };

  // حفظ أو تعديل رقم
  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !phoneNumber || !wilaya) return;

    // التحقق من عدم وجود أكثر من Standard
    if (category === "standard") {
      const existingStandard = contacts.find(
        (c) => c.category === "standard" && c._id !== editingId,
      );
      if (existingStandard) {
        alert(
          `Attention : Un numéro standard existe déjà (${existingStandard.name}).`,
        );
        return;
      }
    }

    try {
      await addApiContacts(
        editingId,
        name,
        phoneNumber,
        selectedCountry,
        type,
        category,
        wilaya,
      );
      fetchData(selectedCountry, user);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // حذف رقم
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce numéro ?"))
      return;

    try {
      const res = await fetch(`/api/service-phone/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setContacts(contacts.filter((c) => c._id !== id));
      } else {
        alert("Erreur lors de la suppression.");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400 gap-2">
        <Loader2 className="animate-spin" size={28} /> Chargement...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <PhoneCall className="text-[#e91818]" /> Gestion des Contacts &
            Régions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les numéros de téléphone et visualisez les wilayas de la
            région.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* اختيار الدولة */}
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
            <Globe size={18} className="text-blue-500" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="Algeria">Algeria</option>
            </select>
          </div>

          {/* زر إضافة رقم جديد */}
          <button
            onClick={() => handleOpenModal()}
            className="bg-[#e91818] hover:bg-[#d01515] text-white px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-red-200 transition-all text-sm"
          >
            <Plus size={18} /> Ajouter
          </button>
        </div>
      </div>

      {/* عرض المدن / الولايات */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-black text-gray-800 mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-[#e91818]" /> Villes / Wilayas de :{" "}
          <span className="text-blue-600">
            {countryData?.country || selectedCountry}
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {countryData?.regions?.map((reg, index) => (
            <span
              key={index}
              className="px-3.5 py-1.5 bg-gray-50 border border-gray-200/60 rounded-xl text-xs font-bold text-gray-700"
            >
              {reg.ville}
            </span>
          ))}
          {(!countryData?.regions || countryData.regions.length === 0) && (
            <p className="text-sm text-gray-400">Aucune ville trouvée.</p>
          )}
        </div>
      </div>

      {/* جدول عرض أرقام الهواتف مع أزرار التعديل والحذف */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-base font-black text-gray-800">
            Numéros de Contact & Support
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Nom / Entité</th>
                <th className="py-4 px-6">Numéro</th>
                <th className="py-4 px-6">Wilaya</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Catégorie</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {contacts.map((contact) => (
                <tr
                  key={contact._id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-4 px-6 font-bold text-gray-800">
                    {contact.name}
                  </td>
                  <td
                    className="py-4 px-6 font-mono font-medium text-gray-600"
                    dir="ltr"
                  >
                    {contact.phoneNumber}
                  </td>
                  <td className="py-4 px-6 text-gray-600">{contact.ville}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-50 text-blue-700">
                      {contact.type}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                        contact.category === "standard"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {contact.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(contact)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(contact._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-400 font-medium"
                  >
                    Aucun contact disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Popup لإضافة وتعديل الأرقام */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">
                {editingId ? "Modifier le contact" : "Ajouter un contact"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Nom / Entité
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Support Central"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e91818]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Numéro de téléphone
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+213 600 00 00 00"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#e91818]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Wilaya / Ville (depuis la base de données)
                </label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e91818]/20"
                >
                  {countryData?.regions?.map((reg) => (
                    <option key={reg.ville} value={reg.ville}>
                      {reg.ville}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as "client" | "driver" | "support")
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
                  >
                    <option value="support">Support</option>
                    <option value="client">Client</option>
                    <option value="driver">Livreur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as "standard" | "branch")
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
                  >
                    <option value="standard">Standard</option>
                    <option value="branch">Branche</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#e91818] hover:bg-[#d01515] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-200"
                >
                  <Save size={16} /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
