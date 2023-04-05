from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login as dj_login
from django.contrib.auth import login
from django.http import HttpResponseRedirect
from django.urls import reverse_lazy, reverse
from django.shortcuts import render
from django.views import generic
from .models import UserIcons
from .forms import UserIconForm, UsernameForm


def login(request):
    if request.method == 'POST':
        user = authenticate(username=request.POST['username'], password=request.POST['password'])
        if user is not None:
            dj_login(request=request, user=user)
            return HttpResponseRedirect(reverse('home'))
    return render(request, 'myAuth/login.html')


class SignUpView(generic.CreateView):
    form_class = UserCreationForm
    success_url = reverse_lazy('myLogin')
    template_name = "myAuth/sign_up2.html"

    def post(self, request, *args, **kwargs):
        form = self.form_class(request.POST)
        if form.is_valid():
            user = form.save(commit=True)
            dj_login(request, user)
            return HttpResponseRedirect(reverse('profile', args=(user.id, )))

        return render(request, self.template_name, {'form': form})


class ProfileView(LoginRequiredMixin, UserPassesTestMixin, generic.DetailView):
    model = User
    context_object_name = 'user'
    template_name = 'myAuth/profile.html'

    def test_func(self):
        return self.request.user.pk == self.kwargs['pk']

    def post(self, request, *args, **kwargs):
        if 'username' not in request.POST:
            form = UserIconForm(request.POST, request.FILES)
            if form.is_valid():
                try:
                    user_icon_object = UserIcons.objects.get(user_id=request.user.id)
                    user_icon_object.user_icon_path = request.FILES['user_icon_path']
                    user_icon_object.save()
                except UserIcons.DoesNotExist:
                    form.save()
        else:
            username_form = UsernameForm(request.POST)
            if username_form.is_valid():
                user = User.objects.get(pk=request.user.id)
                user.username = request.POST['username']
                user.save()

        return HttpResponseRedirect(reverse('profile', args=(request.user.id,)))

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.get_object()
        context['form'] = UserIconForm()
        context['usernameform'] = UsernameForm()

        try:
            user_icon_object = UserIcons.objects.get(user_id=user.id)
            context['icon'] = user_icon_object.user_icon_path
        except UserIcons.DoesNotExist:
            user_icon_object = None

        return context
